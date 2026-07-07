import tsParser from '@typescript-eslint/parser'

// ESLint runs ONLY the rules Oxlint can't express (Oxlint is the primary linter).
// Currently: CLAUDE.md Rule 3 — raw semantic/interactive elements are banned outside
// their component home. Oxlint lacks `no-restricted-syntax`, so this lives here.
export default [
  {
    ignores: ['out/**', 'dist/**', 'node_modules/**'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "JSXOpeningElement[name.name='button']",
          message:
            'Use the <Button> component, not a raw <button> (CLAUDE.md Rule 3). Raw <button> is allowed only in components/Button/.',
        },
      ],
    },
  },
  {
    // The one place raw <button> is allowed.
    files: ['src/renderer/src/components/Button/**'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]
