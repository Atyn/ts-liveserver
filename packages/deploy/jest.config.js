module.exports = {
	transform: {
		'^.+\\.(ts|tsx)$': 'ts-jest',
	},
	cacheDirectory: 'tmp/jest/',
	testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
}
