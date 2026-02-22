import request from 'supertest';
import app from '../../src/app.js';
import { User } from '../../src/models/index.js';

describe('Auth Integration', () => {
    beforeAll(async () => {
        await User.destroy({ where: {} });
    });

    let refreshToken;
    let accessToken;

    it('should register a new user successfully', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: 'testpilot',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });

        expect(res.statusCode).toEqual(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.user.username).toBe('testpilot');
        expect(res.body.data.accessToken).toBeDefined();

        accessToken = res.body.data.accessToken;
        const cookie = res.headers['set-cookie'][0];
        refreshToken = cookie.split(';')[0].split('=')[1];
    });

    it('should not allow duplicate email registration', async () => {
        const res = await request(app)
            .post('/api/v1/auth/register')
            .send({
                username: 'otherpilot',
                email: 'test@example.com',
                password: 'password123',
                confirmPassword: 'password123'
            });

        expect(res.statusCode).toEqual(400);
    });

    it('should login an existing user', async () => {
        const res = await request(app)
            .post('/api/v1/auth/login')
            .send({
                identifier: 'test@example.com',
                password: 'password123'
            });

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.accessToken).toBeDefined();
    });

    it('should access protected route using token', async () => {
        const res = await request(app)
            .get('/api/v1/auth/me')
            .set('Authorization', `Bearer ${accessToken}`);

        expect(res.statusCode).toEqual(200);
        expect(res.body.data.user.email).toBe('test@example.com');
    });
});
