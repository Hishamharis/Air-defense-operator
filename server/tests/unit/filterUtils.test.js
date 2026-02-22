import { buildUserFilters, buildSessionFilters } from '../../src/utils/filterUtils.js';
import { Op } from 'sequelize';

describe('filterUtils', () => {
    it('should build user filters for role and search term', () => {
        const query = {
            role: 'ADMIN',
            search: 'testuser'
        };
        const filter = buildUserFilters(query);

        expect(filter.role).toBe('ADMIN');
        expect(filter[Op.or]).toBeDefined(); // the ILIKE queries block
    });

    it('should build session filters considering date ranges', () => {
        const query = {
            faction: 'US',
            difficulty: 'HARD',
            startDate: '2024-01-01',
            endDate: '2024-12-31'
        };
        const filter = buildSessionFilters(query);

        expect(filter.faction).toBe('US');
        expect(filter.difficulty).toBe('HARD');
        expect(filter.createdAt[Op.gte]).toBeDefined();
        expect(filter.createdAt[Op.lte]).toBeDefined();
    });
});
