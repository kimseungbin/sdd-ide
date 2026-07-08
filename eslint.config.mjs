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
        {
          selector: "JSXOpeningElement[name.name='textarea']",
          message:
            'Use the <Textarea> component, not a raw <textarea> (CLAUDE.md Rule 3). Raw <textarea> is allowed only in components/Textarea/.',
        },
      ],
    },
  },
  {
    // Each wrapped element's one home, where its raw element may be used.
    files: ['src/renderer/src/components/Button/**', 'src/renderer/src/components/Textarea/**'],
    rules: {
      'no-restricted-syntax': 'off',
    },
  },
]
