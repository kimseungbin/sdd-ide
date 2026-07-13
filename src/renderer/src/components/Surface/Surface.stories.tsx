import type { Story } from '@ladle/react'
import type { ReactNode } from 'react'
import { Surface, type SurfaceProps } from './Surface'

export default { title: 'Components / Surface' }

/*
  Glass reads as glass only over content, so every story floats the Surface above a
  mock editor backdrop (the "content layer"). This mirrors Apple's rule: glass lives
  on the navigation layer above content, never in the content layer itself.
*/
function EditorBackdrop({ children }: { children: ReactNode }) {
  const line = (indent: number, tokens: [string, string][]) => (
    <div style={{ paddingLeft: indent * 16, whiteSpace: 'pre' }}>
      {tokens.map(([color, text], i) => (
        <span key={i} style={{ color }}>
          {text}
        </span>
      ))}
    </div>
  )
  return (
    <div
      style={{
        position: 'relative',
        height: 320,
        overflow: 'hidden',
        borderRadius: 8,
        background: 'var(--cm-bg)',
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        fontSize: 'var(--cm-font-size)',
        lineHeight: 1.7,
        padding: 16,
      }}
    >
      {/* Colour behind the glass so refraction/saturation has something to pull from. */}
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(60% 80% at 75% 20%, rgba(53,146,196,0.35), transparent 60%), radial-gradient(50% 60% at 15% 90%, rgba(106,135,89,0.3), transparent 60%)',
        }}
      />
      <div style={{ position: 'relative', color: 'var(--cm-fg)' }}>
        {line(0, [
          ['var(--cm-keyword)', 'export function '],
          ['var(--cm-function)', 'buildSpec'],
          ['var(--cm-fg)', '(ast: '],
          ['var(--cm-type)', 'SpecNode'],
          ['var(--cm-fg)', ') {'],
        ])}
        {line(1, [
          ['var(--cm-keyword)', 'const '],
          ['var(--cm-fg)', 'blocks = ast.'],
          ['var(--cm-property)', 'children'],
          ['var(--cm-fg)', '.'],
          ['var(--cm-function)', 'map'],
          ['var(--cm-fg)', '((n) => n.'],
          ['var(--cm-property)', 'id'],
          ['var(--cm-fg)', ')'],
        ])}
        {line(1, [['var(--cm-comment)', '// glass floats above; content stays solid']])}
        {line(1, [
          ['var(--cm-keyword)', 'return '],
          ['var(--cm-fg)', 'blocks.'],
          ['var(--cm-function)', 'length'],
          ['var(--cm-fg)', ' > '],
          ['var(--cm-number)', '0'],
        ])}
        {line(0, [['var(--cm-fg)', '}']])}
        {line(0, [['var(--cm-comment)', '']])}
        {line(0, [
          ['var(--cm-keyword)', 'const '],
          ['var(--cm-fg)', 'title = '],
          ['var(--cm-string)', '"Spec-Driven IDE"'],
        ])}
      </div>
      <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
        {children}
      </div>
    </div>
  )
}

// The three materials, each over the same content backdrop so the difference is visible.
export const Materials: Story = () => (
  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
    {(['solid', 'glass', 'glassStrong'] as const).map((material) => (
      <div key={material}>
        <div style={{ marginBottom: 8, fontSize: 12, color: 'var(--color-muted)' }}>{material}</div>
        <EditorBackdrop>
          <Surface material={material} padding="normal">
            <div style={{ width: 180, color: 'var(--color-fg)' }}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Command Palette</div>
              <div style={{ fontSize: 13, color: 'var(--color-muted)' }}>
                Navigation-layer chrome — the right home for glass.
              </div>
            </div>
          </Surface>
        </EditorBackdrop>
      </div>
    ))}
  </div>
)

// Where glass actually pays off: a floating overlay that OVERLAPS content. A command
// palette sits over a full screen of code, so the code is visibly frosted through the
// glass and sharp around it — the "content bending behind glass" effect the tiled rail
// can't show (the rail sits beside content, never over it).
function CodeFill() {
  const kw = 'var(--cm-keyword)'
  const fn = 'var(--cm-function)'
  const st = 'var(--cm-string)'
  const nm = 'var(--cm-number)'
  const cm = 'var(--cm-comment)'
  const fg = 'var(--cm-fg)'
  const pr = 'var(--cm-property)'
  const lines: [number, [string, string][]][] = [
    [
      0,
      [
        [kw, 'import '],
        [fg, '{ createStore } '],
        [kw, 'from '],
        [st, "'./store'"],
      ],
    ],
    [
      0,
      [
        [kw, 'import '],
        [fg, '{ SpecNode, Block } '],
        [kw, 'from '],
        [st, "'./types'"],
      ],
    ],
    [0, [[cm, '']]],
    [
      0,
      [
        [kw, 'export function '],
        [fn, 'compileSpec'],
        [fg, '(root: '],
        ['var(--cm-type)', 'SpecNode'],
        [fg, ') {'],
      ],
    ],
    [
      1,
      [
        [kw, 'const '],
        [fg, 'store = '],
        [fn, 'createStore'],
        [fg, '(root)'],
      ],
    ],
    [
      1,
      [
        [kw, 'const '],
        [fg, 'blocks = store.'],
        [pr, 'blocks'],
        [fg, '.'],
        [fn, 'filter'],
        [fg, '((b) => b.'],
        [pr, 'active'],
        [fg, ')'],
      ],
    ],
    [1, [[cm, '// mutations flow only through the validated API — no text escape hatch']]],
    [
      1,
      [
        [kw, 'for '],
        [fg, '('],
        [kw, 'const '],
        [fg, 'b '],
        [kw, 'of '],
        [fg, 'blocks) {'],
      ],
    ],
    [
      2,
      [
        [fg, 'store.'],
        [fn, 'validate'],
        [fg, '(b.'],
        [pr, 'id'],
        [fg, ', '],
        [nm, '2'],
        [fg, ')'],
      ],
    ],
    [
      2,
      [
        [fg, 'store.'],
        [fn, 'commit'],
        [fg, '(b)'],
      ],
    ],
    [1, [[fg, '}']]],
    [
      1,
      [
        [kw, 'return '],
        [fg, 'store.'],
        [fn, 'snapshot'],
        [fg, '()'],
      ],
    ],
    [0, [[fg, '}']]],
    [0, [[cm, '']]],
    [
      0,
      [
        [kw, 'const '],
        [fg, 'title = '],
        [st, '"Spec-Driven Development IDE"'],
      ],
    ],
    [
      0,
      [
        [kw, 'const '],
        [fg, 'version = '],
        [nm, '0.0'],
        [fg, '.'],
        [nm, '0'],
      ],
    ],
  ]
  return (
    <div style={{ color: 'var(--cm-fg)' }}>
      {lines.map(([indent, tokens], i) => (
        <div key={i} style={{ paddingLeft: indent * 16, whiteSpace: 'pre' }}>
          {tokens.map(([color, text], j) => (
            <span key={j} style={{ color }}>
              {text || ' '}
            </span>
          ))}
        </div>
      ))}
    </div>
  )
}

export const Overlay: Story = () => (
  <div
    style={{
      position: 'relative',
      height: 460,
      overflow: 'hidden',
      borderRadius: 8,
      background: 'var(--cm-bg)',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
      fontSize: 'var(--cm-font-size)',
      lineHeight: 1.9,
      padding: 20,
    }}
  >
    {/* Vivid backdrop so transparency is unmistakable — colour bleeds through the glass. */}
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(50% 55% at 30% 25%, rgba(53,146,196,0.7), transparent 60%), radial-gradient(45% 50% at 78% 75%, rgba(204,120,50,0.55), transparent 60%), radial-gradient(40% 45% at 85% 15%, rgba(106,135,89,0.5), transparent 60%)',
      }}
    />
    <div style={{ position: 'absolute', inset: 20 }}>
      <CodeFill />
    </div>
    {/* The floating palette — glass, centred over the code. */}
    <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
      <Surface material="glass" padding="none">
        <div
          style={{
            width: 380,
            fontFamily: 'system-ui, sans-serif',
            color: 'var(--color-fg)',
          }}
        >
          <div
            style={{
              padding: '10px 14px',
              borderBottom: '1px solid var(--glass-highlight)',
              color: 'var(--color-muted)',
            }}
          >
            Go to spec block…
          </div>
          {['Requirements', 'Acceptance criteria', 'Open questions', 'Constraints'].map(
            (row, i) => (
              <div
                key={row}
                style={{
                  padding: '8px 14px',
                  fontSize: 13,
                  background: i === 0 ? 'rgb(var(--glass-tint) / 0.08)' : 'transparent',
                }}
              >
                {row}
              </div>
            ),
          )}
        </div>
      </Surface>
    </div>
  </div>
)

// Playground documents the full prop vocabulary (Rule 7): the only styling knobs are
// the closed material/radius/padding variants — no free-form className/style input.
export const Playground: Story<SurfaceProps & { children: string }> = ({ children, ...args }) => (
  <EditorBackdrop>
    <Surface {...args}>
      <div style={{ width: 200, color: 'var(--color-fg)' }}>{children}</div>
    </Surface>
  </EditorBackdrop>
)
Playground.args = {
  material: 'glass',
  radius: 'md',
  padding: 'normal',
  children: 'A material surface floating above the editor content.',
}
Playground.argTypes = {
  material: { options: ['solid', 'glass', 'glassStrong'], control: { type: 'radio' } },
  radius: { options: ['none', 'md'], control: { type: 'radio' } },
  padding: { options: ['none', 'normal'], control: { type: 'radio' } },
}
