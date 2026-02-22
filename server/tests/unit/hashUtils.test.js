import { hashPassword, comparePassword, hashToken, generateSecureToken } from '../../src/utils/hashUtils.js';

describe('hashUtils', () => {
    it('should hash and verify a password', async () => {
        const password = 'SuperSecretPassword123!';
        const hashed = await hashPassword(password);

        expect(hashed).not.toBe(password);
        expect(await comparePassword(password, hashed)).toBe(true);
        expect(await comparePassword('WrongPassword', hashed)).toBe(false);
    });

    it('should consistently hash a token', () => {
        const token = 'my-jwt-token-string';
        const hash1 = hashToken(token);
        const hash2 = hashToken(token);

        expect(hash1).toBe(hash2);
        expect(hash1).not.toBe(token);
    });

    it('should generate a secure token of specific length', () => {
        const token = generateSecureToken(16);
        // hex encoding means 2 chars per byte, so length is doubly the byte length
        expect(token.length).toBe(32);
    });
});
