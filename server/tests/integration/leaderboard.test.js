import request from 'supertest';
import app from '../../src/app.js';

describe('Leaderboard Integration', () => {
    it('should retrieve global leaderboard', async () => {
        const res = await request(app)
            .get('/api/v1/leaderboard')
            .query({ period: 'ALLTIME' });

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.data.leaderboard)).toBe(true);
    });

    it('should retrieve faction specific leaderboard', async () => {
        const res = await request(app)
            .get('/api/v1/leaderboard/faction/US');

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body.data.leaderboard)).toBe(true);
    });
});
