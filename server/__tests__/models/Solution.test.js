import mongoose from 'mongoose';
import Solution from '../../models/Solution.js';
import * as db from '../setup/testDb.js';

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Solution Model Tests', () => {
  describe('Schema Validation', () => {
    it('should create a valid solution', async () => {
      const solutionData = {
        total_distance: 25.5,
        total_time: 0.6375,
        utilization: 85.5,
        emissions: 5.1,
        trucks: [
          {
            truck_no: 1,
            distance: 10.2,
            load: 150,
            bins: [
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 1, demand: 75 },
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 2, demand: 75 },
            ],
          },
        ],
      };

      const solution = new Solution(solutionData);
      const savedSolution = await solution.save();

      expect(savedSolution._id).toBeDefined();
      expect(savedSolution.total_distance).toBe(25.5);
      expect(savedSolution.trucks).toHaveLength(1);
      expect(savedSolution.created_at).toBeDefined();
    });

    it('should require total_distance field', async () => {
      const solutionWithoutDistance = new Solution({
        total_time: 0.5,
        trucks: [],
      });

      let error;
      try {
        await solutionWithoutDistance.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    it('should have default values', async () => {
      const solution = new Solution({
        total_distance: 15.5,
        total_time: 0.3875,
        trucks: [],
      });

      const savedSolution = await solution.save();
      expect(savedSolution.utilization).toBe(0);
      expect(savedSolution.emissions).toBe(0);
    });

    it('should validate trucks array', async () => {
      const solution = new Solution({
        total_distance: 15.5,
        total_time: 0.3875,
        trucks: [
          {
            truck_no: 1,
            distance: 10.2,
            load: 150,
            bins: [],
          },
        ],
      });

      const savedSolution = await solution.save();
      expect(savedSolution.trucks[0].truck_no).toBe(1);
      expect(savedSolution.trucks[0].bins).toEqual([]);
    });

    it('should set created_at automatically', async () => {
      const solution = new Solution({
        total_distance: 15.5,
        total_time: 0.3875,
        trucks: [],
      });

      const beforeSave = Date.now();
      const savedSolution = await solution.save();
      const afterSave = Date.now();

      expect(savedSolution.created_at.getTime()).toBeGreaterThanOrEqual(beforeSave);
      expect(savedSolution.created_at.getTime()).toBeLessThanOrEqual(afterSave);
    });
  });

  describe('CRUD Operations', () => {
    it('should find solutions by query', async () => {
      await Solution.create([
        {
          total_distance: 15.5,
          total_time: 0.3875,
          trucks: [],
        },
        {
          total_distance: 25.5,
          total_time: 0.6375,
          trucks: [],
        },
      ]);

      const solutions = await Solution.find({ total_distance: { $lt: 20 } });
      expect(solutions).toHaveLength(1);
      expect(solutions[0].total_distance).toBe(15.5);
    });

    it('should sort solutions by created_at', async () => {
      // Create solutions sequentially with slight delay to ensure different timestamps
      const solution1 = await Solution.create({ 
        total_distance: 15.5, 
        total_time: 0.3875, 
        trucks: [] 
      });
      
      // Small delay to ensure different created_at timestamps
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const solution2 = await Solution.create({ 
        total_distance: 25.5, 
        total_time: 0.6375, 
        trucks: [] 
      });

      const solutions = await Solution.find().sort({ created_at: -1 });
      expect(solutions[0].total_distance).toBe(25.5);
      expect(solutions[0]._id.toString()).toBe(solution2._id.toString());
    });

    it('should delete solutions', async () => {
      const solution = await Solution.create({
        total_distance: 15.5,
        total_time: 0.3875,
        trucks: [],
      });

      await Solution.findByIdAndDelete(solution._id);

      const deletedSolution = await Solution.findById(solution._id);
      expect(deletedSolution).toBeNull();
    });
  });

  describe('Complex Truck Data', () => {
    it('should handle multiple trucks with multiple bins', async () => {
      const complexSolution = {
        total_distance: 50.5,
        total_time: 1.2625,
        utilization: 90,
        emissions: 10.1,
        trucks: [
          {
            truck_no: 1,
            distance: 20,
            load: 200,
            bins: [
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 1, demand: 50 },
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 2, demand: 75 },
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 3, demand: 75 },
            ],
          },
          {
            truck_no: 2,
            distance: 18,
            load: 180,
            bins: [
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 1, demand: 60 },
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 2, demand: 60 },
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 3, demand: 60 },
            ],
          },
          {
            truck_no: 3,
            distance: 12.5,
            load: 120,
            bins: [
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 1, demand: 60 },
              { bin_id: new mongoose.Types.ObjectId(), visit_order: 2, demand: 60 },
            ],
          },
        ],
      };

      const solution = await Solution.create(complexSolution);

      expect(solution.trucks).toHaveLength(3);
      expect(solution.trucks[0].bins).toHaveLength(3);
      expect(solution.trucks[1].bins).toHaveLength(3);
      expect(solution.trucks[2].bins).toHaveLength(2);
    });

    it('should maintain bin order within trucks', async () => {
      const binId1 = new mongoose.Types.ObjectId();
      const binId2 = new mongoose.Types.ObjectId();
      const binId3 = new mongoose.Types.ObjectId();
      
      const solution = await Solution.create({
        total_distance: 20,
        total_time: 0.5,
        trucks: [
          {
            truck_no: 1,
            distance: 20,
            load: 200,
            bins: [
              { bin_id: binId3, visit_order: 1, demand: 50 },
              { bin_id: binId1, visit_order: 2, demand: 75 },
              { bin_id: binId2, visit_order: 3, demand: 75 },
            ],
          },
        ],
      });

      // Verify bin order is maintained by checking ObjectIds match
      expect(solution.trucks[0].bins[0].bin_id.toString()).toBe(binId3.toString());
      expect(solution.trucks[0].bins[1].bin_id.toString()).toBe(binId1.toString());
      expect(solution.trucks[0].bins[2].bin_id.toString()).toBe(binId2.toString());
      
      // Verify visit_order is maintained
      expect(solution.trucks[0].bins[0].visit_order).toBe(1);
      expect(solution.trucks[0].bins[1].visit_order).toBe(2);
      expect(solution.trucks[0].bins[2].visit_order).toBe(3);
    });
  });
});


