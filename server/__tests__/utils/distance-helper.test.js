import { getSubMatrix } from '../../utils/distance-helper.js';

describe('Distance Helper Tests', () => {
  describe('getSubMatrix', () => {
    it('should return submatrix for valid bin IDs', () => {
      const binIds = ['bin1', 'bin2', 'bin3'];
      const result = getSubMatrix(binIds);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return correct dimensions', () => {
      const binIds = ['bin1', 'bin2', 'bin3', 'bin4'];
      const result = getSubMatrix(binIds);

      expect(result.length).toBe(binIds.length);
      if (result.length > 0) {
        expect(result[0].length).toBe(binIds.length);
      }
    });

    it('should handle single bin', () => {
      const binIds = ['bin1'];
      const result = getSubMatrix(binIds);

      expect(result).toBeDefined();
      expect(result.length).toBe(1);
    });

    it('should handle empty array', () => {
      const binIds = [];
      const result = getSubMatrix(binIds);

      expect(result).toBeDefined();
      expect(result.length).toBe(0);
    });

    it('should have zero diagonal values', () => {
      const binIds = ['bin1', 'bin2', 'bin3'];
      const result = getSubMatrix(binIds);

      for (let i = 0; i < result.length; i++) {
        expect(result[i][i]).toBe(0);
      }
    });

    it('should have symmetric matrix', () => {
      const binIds = ['bin1', 'bin2', 'bin3'];
      const result = getSubMatrix(binIds);

      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result.length; j++) {
          expect(result[i][j]).toBe(result[j][i]);
        }
      }
    });

    it('should have positive distances', () => {
      const binIds = ['bin1', 'bin2', 'bin3'];
      const result = getSubMatrix(binIds);

      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result.length; j++) {
          if (i !== j) {
            expect(result[i][j]).toBeGreaterThanOrEqual(0);
          }
        }
      }
    });

    it('should handle duplicate bin IDs', () => {
      const binIds = ['bin1', 'bin1', 'bin2'];
      const result = getSubMatrix(binIds);

      expect(result).toBeDefined();
      expect(result.length).toBe(binIds.length);
    });

    it('should handle unknown bin IDs gracefully', () => {
      const binIds = ['unknown1', 'unknown2'];
      
      // Should throw error for unknown bin IDs
      expect(() => getSubMatrix(binIds)).toThrow('One or more selected bin IDs not found');
    });

    it('should return consistent results for same input', () => {
      const binIds = ['bin1', 'bin2', 'bin3'];
      const result1 = getSubMatrix(binIds);
      const result2 = getSubMatrix(binIds);

      expect(result1).toEqual(result2);
    });
  });
});

