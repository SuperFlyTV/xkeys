module.exports = {
	extends: './node_modules/@sofie-automation/code-standard-preset/eslint/main',
	env: {
		node: true,
		jest: true,
	},
	ignorePatterns: ['**/dist/**/*', '**/__tests__/**/*', '**/__mocks__/**/*', '**/examples/**/*', '**/scripts/**/*'],
}
