import { calculateScore, assessSessionValidity } from '../../src/utils/gameUtils.js';

describe('gameUtils', () => {
    it('should calculate score correctly', () => {
        const stats = {
            waveReached: 10,
            finalHp: 80,
            totalIntercepted: 100,
            totalBreached: 10
        };
        const score = calculateScore(stats, 1.5);

        // (1000 + 1000 + 400) * 1.5 = 2400 * 1.5 = 3600
        expect(score).toBe(3600);
    });

    it('should assess standard session as valid', () => {
        const session = {
            waveReached: 5,
            score: 15000,
            sessionDurationMs: 300000, // 5 mins
            difficultyModifier: 1.0
        };
        expect(assessSessionValidity(session)).toBe(true);
    });

    it('should assess impossibly fast session as invalid', () => {
        const session = {
            waveReached: 50, // 50 waves in 10 seconds is impossible
            score: 1000000,
            sessionDurationMs: 10000,
            difficultyModifier: 1.0
        };
        expect(assessSessionValidity(session)).toBe(false);
    });
});
