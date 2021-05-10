module.exports = {
    roots: ['<rootDir>/src'],
    projects: ['<rootDir>'],
    preset: 'ts-jest',
	globals: {
		'ts-jest': {
			tsconfig: 'tsconfig.json',
		},
	},
	moduleFileExtensions: ['js', 'ts'],
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
	testMatch: ['**/__tests__/**/*.spec.(ts|js)'],
	testEnvironment: 'node',
	coverageThreshold: {
		global: {
			branches: 100,
			functions: 100,
			lines: 100,
			statements: 100,
		},
	},
	coverageDirectory: './coverage/',
    coverageDirectory: '<rootDir>/coverage/',
    collectCoverage: false,
    // verbose: true,
}
