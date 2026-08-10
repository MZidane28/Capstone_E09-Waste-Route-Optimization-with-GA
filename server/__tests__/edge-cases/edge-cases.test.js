import Bin from '../../models/Bin.js';
import Solution from '../../models/Solution.js';
import * as db from '../setup/testDb.js';

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

const route = (overrides = {}) => ({
  truck_no: 1,
  distance: 10.2,
  load: 150,
  utilization: 75,
  unused_capacity: 50,
  emissions: 2.5,
  route: ['BIN_001', 'BIN_002'],
  ...overrides,
});

const solution = (overrides = {}) => ({
  simulation_day: 1,
  method: 'ga',
  total_distance: 25.5,
  total_emissions: 5.1,
  avg_utilization: 85.5,
  number_of_trucks: 1,
  execution_time: 120,
  routes: [route()],
  ...overrides,
});

describe('Edge Cases and Error Handling Tests', () => {
  describe('Bin Edge Cases', () => {
    it('should handle very large fill values', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_E01',
        name: 'Large Fill Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 1000,
        fill_rate: 10,
        current_fill_ga: 999999,
      });

      expect(bin.current_fill_ga).toBe(999999);
    });

    it('should handle zero fill', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_E02',
        name: 'Empty Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 10,
        current_fill_ga: 0,
      });

      expect(bin.current_fill_ga).toBe(0);
      expect(bin.getFillPercentage('ga')).toBe(0);
    });

    it('should handle fill exceeding capacity', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_E03',
        name: 'Overflowing Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 10,
        current_fill_ga: 150, // Exceeds capacity
      });

      expect(bin.current_fill_ga).toBeGreaterThan(bin.capacity);
      expect(bin.getFillPercentage('ga')).toBeGreaterThan(100);
      expect(bin.needsCollection()).toBe(true);
    });

    it('should handle extreme coordinates', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_E04',
        name: 'Edge Location Bin',
        location: { lat: -90, lon: 180 }, // Extreme coordinates
        capacity: 100,
        fill_rate: 50,
      });

      expect(bin.location.lat).toBe(-90);
      expect(bin.location.lon).toBe(180);
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(500);
      const bin = await Bin.create({
        bin_id: 'BIN_E05',
        name: longName,
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      expect(bin.name.length).toBe(500);
    });

    it('should handle special characters in name', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_E06',
        name: 'Bin #1 @ Location (Test) - "Special"',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      expect(bin.name).toContain('#');
      expect(bin.name).toContain('@');
    });

    it('should reject a duplicate bin_id', async () => {
      await Bin.create({
        bin_id: 'BIN_E07',
        name: 'First',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      let error;
      try {
        await Bin.create({
          bin_id: 'BIN_E07',
          name: 'Duplicate',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 50,
        });
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Solution Edge Cases', () => {
    it('should handle solution with zero distance', async () => {
      const saved = await Solution.create(
        solution({ total_distance: 0, total_emissions: 0, number_of_trucks: 0, routes: [] })
      );

      expect(saved.total_distance).toBe(0);
    });

    it('should handle solution with many trucks', async () => {
      const routes = Array.from({ length: 100 }, (_, i) =>
        route({ truck_no: i + 1, distance: Math.random() * 20, load: Math.random() * 200 })
      );

      const saved = await Solution.create(
        solution({ total_distance: 500, number_of_trucks: 100, routes })
      );

      expect(saved.routes).toHaveLength(100);
    });

    it('should handle very large distance values', async () => {
      const saved = await Solution.create(
        solution({ total_distance: 999999.99, total_emissions: 24999.998 })
      );

      expect(saved.total_distance).toBe(999999.99);
    });

    it('should handle a route with many bins', async () => {
      const bins = Array.from({ length: 50 }, (_, i) => `BIN_${String(i + 1).padStart(3, '0')}`);

      const saved = await Solution.create(
        solution({ routes: [route({ route: bins, load: 500, distance: 100 })] })
      );

      expect(saved.routes[0].route).toHaveLength(50);
    });

    it('should reject negative distance values', async () => {
      // The schema carries min: 0 validators, so negatives must not be stored
      let error;
      try {
        await Solution.create(solution({ total_distance: -10 }));
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.total_distance).toBeDefined();
    });

    it('should reject a duplicate day and method pair', async () => {
      await Solution.create(solution({ simulation_day: 9, method: 'ga' }));

      let error;
      try {
        await Solution.create(solution({ simulation_day: 9, method: 'ga' }));
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous creates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Bin.create({
          bin_id: `BIN_C${i}`,
          name: `Concurrent Bin ${i}`,
          location: { lat: -6.2088 + i * 0.001, lon: 106.8456 + i * 0.001 },
          capacity: 100,
          fill_rate: 50,
        })
      );

      const bins = await Promise.all(promises);
      expect(bins).toHaveLength(10);
    });

    it('should handle multiple simultaneous updates', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_C10',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      // Simulate concurrent updates
      const updates = [
        Bin.findByIdAndUpdate(bin._id, { fill_rate: 60 }, { new: true }),
        Bin.findByIdAndUpdate(bin._id, { fill_rate: 70 }, { new: true }),
        Bin.findByIdAndUpdate(bin._id, { fill_rate: 80 }, { new: true }),
      ];

      await Promise.all(updates);
      const finalBin = await Bin.findById(bin._id);

      // Last update should win
      expect(finalBin.fill_rate).toBeGreaterThanOrEqual(60);
    });
  });

  describe('Query Edge Cases', () => {
    it('should handle empty query results', async () => {
      const bins = await Bin.find({ name: 'Non-existent' });
      expect(bins).toEqual([]);
    });

    it('should handle complex queries', async () => {
      await Bin.create([
        {
          bin_id: 'BIN_Q1',
          name: 'Bin A',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          fill_rate: 10,
          current_fill_ga: 30,
          is_real: true,
        },
        {
          bin_id: 'BIN_Q2',
          name: 'Bin B',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 10,
          current_fill_ga: 70,
          is_real: false,
        },
        {
          bin_id: 'BIN_Q3',
          name: 'Bin C',
          location: { lat: -6.209, lon: 106.8458 },
          capacity: 100,
          fill_rate: 10,
          current_fill_ga: 90,
          is_real: true,
        },
      ]);

      // Complex query: real bins filled between 50 and 95
      const bins = await Bin.find({
        is_real: true,
        current_fill_ga: { $gt: 50, $lt: 95 },
      });

      expect(bins).toHaveLength(1);
      expect(bins[0].name).toBe('Bin C');
    });

    it('should return bins above the GA collection threshold', async () => {
      await Bin.create([
        {
          bin_id: 'BIN_Q4',
          name: 'Low',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          fill_rate: 10,
          current_fill_ga: 20,
        },
        {
          bin_id: 'BIN_Q5',
          name: 'High',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 10,
          current_fill_ga: 85,
        },
      ]);

      const due = await Bin.getBinsForGA(80);

      expect(due).toHaveLength(1);
      expect(due[0].name).toBe('High');
    });

    it('should handle sorting with ties', async () => {
      await Bin.create([
        {
          bin_id: 'BIN_S1',
          name: 'Bin A',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          fill_rate: 50,
        },
        {
          bin_id: 'BIN_S2',
          name: 'Bin B',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 50, // Same fill_rate
        },
        {
          bin_id: 'BIN_S3',
          name: 'Bin C',
          location: { lat: -6.209, lon: 106.8458 },
          capacity: 100,
          fill_rate: 50, // Same fill_rate
        },
      ]);

      const bins = await Bin.find().sort({ fill_rate: -1, name: 1 });

      expect(bins).toHaveLength(3);
      expect(bins[0].name).toBe('Bin A');
      expect(bins[1].name).toBe('Bin B');
      expect(bins[2].name).toBe('Bin C');
    });
  });

  describe('Database Connection Edge Cases', () => {
    it('should handle invalid ObjectId gracefully', async () => {
      let error;
      try {
        await Bin.findById('invalid-id');
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.name).toBe('CastError');
    });

    it('should handle findByIdAndUpdate with non-existent ID', async () => {
      const result = await Bin.findByIdAndUpdate(
        '507f1f77bcf86cd799439011',
        { fill_rate: 100 },
        { new: true }
      );

      expect(result).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should keep solution routes intact after a referenced bin is deleted', async () => {
      const bins = await Bin.create([
        {
          bin_id: 'BIN_R1',
          name: 'Bin 1',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          fill_rate: 50,
        },
        {
          bin_id: 'BIN_R2',
          name: 'Bin 2',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 75,
        },
      ]);

      const saved = await Solution.create(
        solution({ routes: [route({ route: ['BIN_R1', 'BIN_R2'] })] })
      );

      // Delete a bin
      await Bin.findByIdAndDelete(bins[0]._id);

      // Routes store bin_id strings, so the solution keeps its history
      // (there is no cascade delete by design)
      const found = await Solution.findById(saved._id);
      expect(found.routes[0].route).toEqual(['BIN_R1', 'BIN_R2']);
    });
  });
});
