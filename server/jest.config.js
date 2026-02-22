export default {
    testEnvironment: 'node',
    transform: {},
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/server.js',
        '!src/scripts/**/*.js'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    setupFilesAfterEnv: [],
    testMatch: ['**/tests/**/*.test.js'],
    clearMocks: true
};
