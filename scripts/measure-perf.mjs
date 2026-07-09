// Performance measurement harness — records bundle size, cold-start time, and idle memory
// for the *built* app (out/) and emits a JSON blob. CI attaches this to the commit as a
// git note under refs/notes/perf so every push to main carries a comparable perf snapshot.
//
// Runtime metrics are noisy, so we launch the app PERF_RUNS times (default 5) and report the
// median. Numbers are only comparable across commits when measured on the same hardware —
// that is why this runs in CI (ubuntu-latest under xvfb), never in a local hook.
//
// Usage:  node scripts/measure-perf.mjs            # prints summary, writes perf-metrics.json
//         PERF_RUNS=3 node scripts/measure-perf.mjs
import { _electron as electron } from 'playwright'
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

const RUNS = Number(process.env.PERF_RUNS ?? 5)
const MAIN_ENTRY = join(root, 'out', 'main', 'index.js')
const OUTPUT = join(root, 'perf-metrics.json')

/** Sum every file's size under a directory tree, in bytes. Returns 0 if the dir is absent. */
function dirBytes(dir) {
  let total = 0
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return 0
  }
  for (const entry of entries) {
    const full = join(dir, entry.name)
    total += entry.isDirectory() ? dirBytes(full) : statSync(full).size
  }
  return total
}

/**
 * Bytes the renderer loads *eagerly* at startup: the module entry script, anything Vite
 * marks `modulepreload`, and the stylesheet — parsed straight out of index.html's <head>.
 * This is the number code-splitting actually moves; totalBytes hides it (lazy chunks still
 * exist on disk, they just aren't fetched until a document opens).
 */
function initialRendererBytes() {
  let html
  try {
    html = readFileSync(join(root, 'out', 'renderer', 'index.html'), 'utf8')
  } catch {
    return 0
  }
  const head = html.slice(0, html.indexOf('</head>'))
  const refs = new Set([...head.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((m) => m[1]))
  let total = 0
  for (const ref of refs) {
    try {
      total += statSync(join(root, 'out', 'renderer', ref.replace(/^\.?\//, ''))).size
    } catch {
      // A cross-origin or absent ref — skip it.
    }
  }
  return total
}

/** Median of a numeric array (average of the two middle values for even lengths). */
function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/** One cold launch: spawn Electron, wait for first paint, read process memory, tear down. */
async function measureLaunch() {
  const t0 = process.hrtime.bigint()
  const electronApp = await electron.launch({
    // --no-sandbox: required for Electron under CI/xvfb. args[0] is the built main entry.
    args: [MAIN_ENTRY, '--no-sandbox'],
  })
  try {
    const window = await electronApp.firstWindow()
    const launchToWindowMs = Number(process.hrtime.bigint() - t0) / 1e6

    // First Contentful Paint, relative to the renderer's own navigation start — a
    // harness-overhead-free view of how fast the UI actually paints.
    const firstPaintMs = await window.evaluate(
      () =>
        new Promise((resolve) => {
          const seen = performance.getEntriesByName('first-contentful-paint')[0]
          if (seen) return resolve(seen.startTime)
          new PerformanceObserver((list, obs) => {
            const entry = list.getEntries().find((e) => e.name === 'first-contentful-paint')
            if (entry) {
              obs.disconnect()
              resolve(entry.startTime)
            }
          }).observe({ type: 'paint', buffered: true })
        }),
    )

    // Let the app settle to a steady state before sampling memory.
    await window.waitForTimeout(1500)

    // app.getAppMetrics() runs in the MAIN process and reports every child process
    // (main, renderer, GPU, utility). workingSetSize is in KB.
    const metrics = await electronApp.evaluate(({ app }) => app.getAppMetrics())
    const idleWorkingSetKb = metrics.reduce((sum, m) => sum + (m.memory?.workingSetSize ?? 0), 0)

    return { launchToWindowMs, firstPaintMs, idleWorkingSetKb }
  } finally {
    await electronApp.close()
  }
}

async function main() {
  const bundle = {
    mainBytes: dirBytes(join(root, 'out', 'main')),
    preloadBytes: dirBytes(join(root, 'out', 'preload')),
    rendererBytes: dirBytes(join(root, 'out', 'renderer')),
    rendererInitialBytes: initialRendererBytes(),
  }
  bundle.totalBytes = bundle.mainBytes + bundle.preloadBytes + bundle.rendererBytes

  const samples = []
  for (let i = 0; i < RUNS; i++) {
    samples.push(await measureLaunch())
    process.stderr.write(`  run ${i + 1}/${RUNS} done\n`)
  }

  const result = {
    schema: 1,
    commit: process.env.GITHUB_SHA ?? null,
    node: process.version,
    electron: require('electron/package.json').version,
    runs: RUNS,
    bundle,
    startup: {
      launchToWindowMsMedian: Math.round(median(samples.map((s) => s.launchToWindowMs))),
      firstPaintMsMedian: Math.round(median(samples.map((s) => s.firstPaintMs))),
    },
    memory: {
      idleWorkingSetKbMedian: Math.round(median(samples.map((s) => s.idleWorkingSetKb))),
    },
  }

  writeFileSync(OUTPUT, JSON.stringify(result, null, 2) + '\n')

  const kb = (b) => `${(b / 1024).toFixed(0)} KB`
  process.stderr.write(
    [
      '',
      '── perf ──────────────────────────────',
      `bundle   renderer initial ${kb(bundle.rendererInitialBytes)} / ${kb(bundle.rendererBytes)} total  ·  main ${kb(bundle.mainBytes)} · preload ${kb(bundle.preloadBytes)}`,
      `startup  first-paint ${result.startup.firstPaintMsMedian} ms  ·  launch→window ${result.startup.launchToWindowMsMedian} ms`,
      `memory   idle working-set ${(result.memory.idleWorkingSetKbMedian / 1024).toFixed(0)} MB`,
      `(median of ${RUNS} runs → ${OUTPUT})`,
      '──────────────────────────────────────',
      '',
    ].join('\n'),
  )
}

main().catch((err) => {
  process.stderr.write(`perf measurement failed: ${err?.stack ?? err}\n`)
  process.exit(1)
})
