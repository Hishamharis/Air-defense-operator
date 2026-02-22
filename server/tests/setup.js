import { sequelize } from '../src/config/database.js';
import redisClient from '../src/config/redis.js';

// Global setup for Jest tests
beforeAll(async () => {
    // Disable logging during tests
    process.env.NODE_ENV = 'test';

    // Attempt database sync (assuming sqlite or local pg test db configured in env)
    try {
        await sequelize.sync({ force: true });
    } catch (e) {
        console.warn('Test DB sync failed:', e.message);
    }
});

afterAll(async () => {
    // Clean up connections
    try {
        await sequelize.close();
        redisClient.disconnect();
    } catch (e) {
        console.warn('Teardown error:', e.message);
    }
});
