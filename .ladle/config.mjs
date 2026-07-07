/** @type {import('@ladle/react').UserConfig} */
export default {
  stories: 'src/**/*.stories.{ts,tsx}',
  // Ladle bundles its own React setup; we only add Tailwind to its Vite pipeline.
  viteConfig: '.ladle/vite.config.ts',
}
