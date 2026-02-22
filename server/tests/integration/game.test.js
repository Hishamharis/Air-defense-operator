import request from 'supertest';
import app from '../../src/app.js';
import { User, GameSession } from '../../src/models/index.js';

describe('Game Session Integration', () => {
    let token;

    beforeAll(async () => {
        await User.destroy({ where: {} });

        const res = await request(app).post('/api/v1/auth/register').send({
            username: 'gameplayer',
            email: 'game@example.com',
            password: 'password123',
            confirmPassword: 'password123'
        });
        token = res.body.data.accessToken;
    });

    let sessionId;

    it('should create a new game session', async () => {
        const res = await request(app)
            .post('/api/v1/game')
            .set('Authorization', `Bearer ${token}`)
            .send({ faction: 'US', difficulty: 'NORMAL' });

        expect(res.statusCode).toEqual(201);
        expect(res.body.data.session.id).toBeDefined();
        expect(res.body.data.session.faction).toBe('US');
        sessionId = res.body.data.session.id;
    });

    it('should complete a game session and calculate score', async () => {
        const res = await request(app)
            .post(`/api/v1/game/${sessionId}/complete`)
            .set('Authorization', `Bearer ${token}`)
            .send({
                waveReached: 5,
                finalHp: 90,
                killRatio: 0.85,
                totalIntercepted: 45,
                totalBreached: 5,
                totalThreatsSpawned: 50
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.session.isCompleted).toBe(true);
        expect(res.body.data.session.score).toBeGreaterThan(0);
    });
});
