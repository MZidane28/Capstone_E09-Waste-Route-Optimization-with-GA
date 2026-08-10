import { getSubMatrix } from '../../utils/distance-helper.js';

// getSubMatrix always prepends the depot, so a request for n bins returns an
// (n + 1) x (n + 1) matrix with the depot at index 0.
describe('Distance Helper Tests', () => {
  describe('getSubMatrix', () => {
    it('should return submatrix for valid bin IDs', () => {
      const binIds = ['BIN_001', 'BIN_002', 'BIN_003'];
      const result = getSubMatrix(binIds);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should return correct dimensions including the depot row', () => {
      const binIds = ['BIN_001', 'BIN_002', 'BIN_003', 'BIN_004'];
      const result = getSubMatrix(binIds);

      expect(result.length).toBe(binIds.length + 1);
      result.forEach((row) => {
        expect(row.length).toBe(binIds.length + 1);
      });
    });

    it('should handle single bin', () => {
      const result = getSubMatrix(['BIN_001']);

      expect(result).toBeDefined();
      expect(result.length).toBe(2); // depot + one bin
    });

    it('should return only the depot for an empty selection', () => {
      const result = getSubMatrix([]);

      expect(result).toEqual([[0]]);
    });

    it('should have zero diagonal values', () => {
      const result = getSubMatrix(['BIN_001', 'BIN_002', 'BIN_003']);

      for (let i = 0; i < result.length; i++) {
        expect(result[i][i]).toBe(0);
      }
    });

    it('should return finite non-negative distances', () => {
      const result = getSubMatrix(['BIN_001', 'BIN_002', 'BIN_003']);

      for (let i = 0; i < result.length; i++) {
        for (let j = 0; j < result.length; j++) {
          expect(Number.isFinite(result[i][j])).toBe(true);
          expect(result[i][j]).toBeGreaterThanOrEqual(0);
        }
      }
    });

    it('should preserve the asymmetry of road distances', () => {
      // These are driving distances, not straight lines: A -> B and B -> A
      // legitimately differ, so the matrix must not be forced symmetric.
      const result = getSubMatrix(['BIN_049', 'BIN_119']);

      expect(result[1][2]).not.toBe(result[2][1]);
    });

    it('should preserve the order of the requested bins', () => {
      const forward = getSubMatrix(['BIN_001', 'BIN_002']);
      const reversed = getSubMatrix(['BIN_002', 'BIN_001']);

      expect(forward[1][2]).toBe(reversed[2][1]);
    });

    it('should handle duplicate bin IDs', () => {
      const binIds = ['BIN_001', 'BIN_001', 'BIN_002'];
      const result = getSubMatrix(binIds);

      expect(result).toBeDefined();
      expect(result.length).toBe(binIds.length + 1);
      expect(result[1][2]).toBe(0); // same bin twice, zero distance apart
    });

    it('should handle unknown bin IDs gracefully', () => {
      const binIds = ['unknown1', 'unknown2'];

      // Should throw error for unknown bin IDs
      expect(() => getSubMatrix(binIds)).toThrow('One or more selected bin IDs not found');
    });

    it('should return consistent results for same input', () => {
      const binIds = ['BIN_001', 'BIN_002', 'BIN_003'];
      const result1 = getSubMatrix(binIds);
      const result2 = getSubMatrix(binIds);

      expect(result1).toEqual(result2);
    });
  });
});
