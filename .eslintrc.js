const warn = 'warn'
const off = 'off'
const always = 'always'

module.exports = {
	parser: '@typescript-eslint/parser',
	plugins: ['prettier', '@typescript-eslint', 'filenames', 'import'],
	env: {
		browser: true,
		es6: true,
		node: true,
		worker: true,
		jasmine: true,
		jest: true,
	},
	overrides: [
		{
			plugins: ['json'],
			files: ['*.json'],
			extends: ['plugin:json/recommended'],
		},
	],
	extends: ['plugin:@typescript-eslint/recommended', 'prettier'],
	rules: {
		'no-console': warn,
		'no-unused-vars': off,
		'@typescript-eslint/no-unused-vars': off,
		indent: off,
		'no-const-assign': warn,
		'no-use-before-define': off,
		'@typescript-eslint/no-unused-vars': off,
		'@typescript-eslint/no-use-before-define': off,
		'@typescript-eslint/member-delimiter-style': off,
		'@typescript-eslint/explicit-function-return-type': off,
		'no-unexpected-multiline': warn,
		'prefer-const': warn,
		'no-empty': warn,
		'no-shadow': warn,
		'no-invalid-this': warn,
		'consistent-return': warn,
		'func-names': [warn, always],
		'func-style': [warn, 'declaration', { allowArrowFunctions: true }],
		'vars-on-top': warn,
		'global-require': warn,
		'init-declarations': [warn, always],
		'no-use-before-define': [warn, { functions: false }],
		'arrow-spacing': warn,
		'no-var': warn,
		'prefer-rest-params': warn,
		'import/no-extraneous-dependencies': warn,
		'no-useless-rename': warn,
		'filenames/match-exported': warn,
	},
}
