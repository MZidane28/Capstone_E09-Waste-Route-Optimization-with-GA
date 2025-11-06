import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import Bin from '../../models/Bin.js';
import Solution from '../../models/Solution.js';
import * as db from '../setup/testDb.js';

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Edge Cases and Error Handling Tests', () => {
  describe('Bin Edge Cases', () => {
    it('should handle very large demand values', async () => {
      const bin = await Bin.create({
        name: 'Large Demand Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 1000,
        demand: 999999,
        is_real: true,
      });

      expect(bin.demand).toBe(999999);
    });

    it('should handle zero demand', async () => {
      const bin = await Bin.create({
        name: 'Empty Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 0,
        is_real: true,
      });

      expect(bin.demand).toBe(0);
    });

    it('should handle demand exceeding capacity', async () => {
      const bin = await Bin.create({
        name: 'Overflowing Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 150, // Exceeds capacity
        is_real: true,
      });

      expect(bin.demand).toBeGreaterThan(bin.capacity);
    });

    it('should handle extreme coordinates', async () => {
      const bin = await Bin.create({
        name: 'Edge Location Bin',
        location: { lat: -90, lon: 180 }, // Extreme coordinates
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      expect(bin.location.lat).toBe(-90);
      expect(bin.location.lon).toBe(180);
    });

    it('should handle very long names', async () => {
      const longName = 'A'.repeat(500);
      const bin = await Bin.create({
        name: longName,
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      expect(bin.name.length).toBe(500);
    });

    it('should handle special characters in name', async () => {
      const bin = await Bin.create({
        name: 'Bin #1 @ Location (Test) - "Special"',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      expect(bin.name).toContain('#');
      expect(bin.name).toContain('@');
    });
  });

  describe('Solution Edge Cases', () => {
    it('should handle solution with zero distance', async () => {
      const solution = await Solution.create({
        total_distance: 0,
        total_time: 0,
        trucks: [],
      });

      expect(solution.total_distance).toBe(0);
    });

    it('should handle solution with many trucks', async () => {
      const trucks = Array.from({ length: 100 }, (_, i) => ({
        truck_no: i + 1,
        distance: Math.random() * 20,
        load: Math.random() * 200,
        bins: [],
      }));

      const solution = await Solution.create({
        total_distance: 500,
        total_time: 12.5,
        trucks,
      });

      expect(solution.trucks).toHaveLength(100);
    });

    it('should handle very large distance values', async () => {
      const solution = await Solution.create({
        total_distance: 999999.99,
        total_time: 24999.998,
        trucks: [],
      });

      expect(solution.total_distance).toBe(999999.99);
    });

    it('should handle solution with many bins per truck', async () => {
      const bins = Array.from({ length: 50 }, (_, i) => ({
        bin_id: new mongoose.Types.ObjectId(),
        visit_order: i + 1,
        demand: 10,
      }));

      const solution = await Solution.create({
        total_distance: 100,
        total_time: 2.5,
        trucks: [
          {
            truck_no: 1,
            distance: 100,
            load: 500,
            bins,
          },
        ],
      });

      expect(solution.trucks[0].bins).toHaveLength(50);
    });

    it('should handle negative values gracefully', async () => {
      // MongoDB will accept negative values unless we add validators
      const solution = await Solution.create({
        total_distance: -10, // Invalid but allowed without validator
        total_time: 0.5,
        trucks: [],
      });

      expect(solution.total_distance).toBe(-10);
      // In production, add schema validator to prevent negative values
    });
  });

  describe('Concurrent Operations', () => {
    it('should handle multiple simultaneous creates', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Bin.create({
          name: `Concurrent Bin ${i}`,
          location: { lat: -6.2088 + i * 0.001, lon: 106.8456 + i * 0.001 },
          capacity: 100,
          demand: 50,
          is_real: true,
        })
      );

      const bins = await Promise.all(promises);
      expect(bins).toHaveLength(10);
    });

    it('should handle multiple simultaneous updates', async () => {
      const bin = await Bin.create({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      // Simulate concurrent updates
      const updates = [
        Bin.findByIdAndUpdate(bin._id, { demand: 60 }, { new: true }),
        Bin.findByIdAndUpdate(bin._id, { demand: 70 }, { new: true }),
        Bin.findByIdAndUpdate(bin._id, { demand: 80 }, { new: true }),
      ];

      const results = await Promise.all(updates);
      const finalBin = await Bin.findById(bin._id);
      
      // Last update should win
      expect(finalBin.demand).toBeGreaterThanOrEqual(60);
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
          name: 'Bin A',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          demand: 30,
          is_real: true,
        },
        {
          name: 'Bin B',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          demand: 70,
          is_real: false,
        },
        {
          name: 'Bin C',
          location: { lat: -6.2090, lon: 106.8458 },
          capacity: 100,
          demand: 90,
          is_real: true,
        },
      ]);

      // Complex query: real bins with demand > 50 and < 95
      const bins = await Bin.find({
        is_real: true,
        demand: { $gt: 50, $lt: 95 },
      });

      expect(bins).toHaveLength(1);
      expect(bins[0].name).toBe('Bin C');
    });

    it('should handle sorting with ties', async () => {
      await Bin.create([
        {
          name: 'Bin A',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          demand: 50,
          is_real: true,
        },
        {
          name: 'Bin B',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          demand: 50, // Same demand
          is_real: true,
        },
        {
          name: 'Bin C',
          location: { lat: -6.2090, lon: 106.8458 },
          capacity: 100,
          demand: 50, // Same demand
          is_real: true,
        },
      ]);

      const bins = await Bin.find().sort({ demand: -1, name: 1 });
      
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
        { demand: 100 },
        { new: true }
      );

      expect(result).toBeNull();
    });
  });

  describe('Data Integrity', () => {
    it('should maintain referential integrity', async () => {
      const bins = await Bin.create([
        {
          name: 'Bin 1',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          demand: 50,
          is_real: true,
        },
        {
          name: 'Bin 2',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          demand: 75,
          is_real: true,
        },
      ]);

      const solution = await Solution.create({
        total_distance: 15.5,
        total_time: 0.3875,
        trucks: [
          {
            truck_no: 1,
            distance: 15.5,
            load: 125,
            bins: [
              { bin_id: bins[0]._id.toString(), visit_order: 1, demand: 50 },
              { bin_id: bins[1]._id.toString(), visit_order: 2, demand: 75 },
            ],
          },
        ],
      });

      // Delete a bin
      await Bin.findByIdAndDelete(bins[0]._id);

      // Solution still references deleted bin (in production, add cascade delete)
      const foundSolution = await Solution.findById(solution._id);
      expect(foundSolution.trucks[0].bins).toHaveLength(2);
    });
  });
});


