import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default tseslint.config(
	{ ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },

	// Application and test sources.
	{
		files: ['**/*.{ts,tsx}'],
		extends: [js.configs.recommended, ...tseslint.configs.recommended],
		languageOptions: {
			ecmaVersion: 2022,
			sourceType: 'module',
			globals: { ...globals.browser, ...globals.es2022 },
		},
		plugins: {
			'react-hooks': reactHooks,
			'react-refresh': reactRefresh,
		},
		rules: {
			// The classic two hook rules are hard errors. The rest of the v7 set
			// (set-state-in-effect, immutability, purity...) flags real patterns in
			// SecTrace, WelcomeModal and useCloudSnapshots that deserve their own
			// pass - see ROADMAP.md - so they stay off rather than blocking CI.
			'react-hooks/rules-of-hooks': 'error',
			'react-hooks/exhaustive-deps': 'warn',
			'react-refresh/only-export-components': [
				'warn',
				{ allowConstantExport: true },
			],
			// Every current violation is a Recharts render-prop callback. A ratchet
			// to tighten once those are typed, not a reason to fail the build.
			'@typescript-eslint/no-explicit-any': 'warn',
			// Underscore-prefixed bindings are deliberate discards - the styles
			// files and destructuring in guinier.ts both rely on this.
			'@typescript-eslint/no-unused-vars': [
				'error',
				{
					argsIgnorePattern: '^_',
					varsIgnorePattern: '^_',
					caughtErrors: 'none',
					ignoreRestSiblings: true,
				},
			],
		},
	},

	// Test files run in Node and legitimately use non-null assertions on
	// fixtures whose shape the test itself guarantees.
	{
		files: ['**/*.test.ts', 'src/test/**/*.ts'],
		languageOptions: { globals: { ...globals.node } },
		rules: { '@typescript-eslint/no-non-null-assertion': 'off' },
	},

	// Config files are Node modules, not browser code.
	{
		files: ['*.config.{js,ts}'],
		languageOptions: { globals: { ...globals.node } },
	},
)
