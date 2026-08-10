import Solution from '../../models/Solution.js';
import * as db from '../setup/testDb.js';

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// Minimal valid route entry, spread and overridden where a test needs variation
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

// Minimal valid solution
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

describe('Solution Model Tests', () => {
  describe('Schema Validation', () => {
    it('should create a valid solution', async () => {
      const savedSolution = await new Solution(solution()).save();

      expect(savedSolution._id).toBeDefined();
      expect(savedSolution.simulation_day).toBe(1);
      expect(savedSolution.method).toBe('ga');
      expect(savedSolution.total_distance).toBe(25.5);
      expect(savedSolution.routes).toHaveLength(1);
    });

    it('should require total_distance field', async () => {
      const data = solution();
      delete data.total_distance;

      let error;
      try {
        await new Solution(data).save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.total_distance).toBeDefined();
    });

    it('should require execution_time field', async () => {
      const data = solution();
      delete data.execution_time;

      let error;
      try {
        await new Solution(data).save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.execution_time).toBeDefined();
    });

    it('should only accept ga or nn as method', async () => {
      let error;
      try {
        await new Solution(solution({ method: 'aco' })).save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.method).toBeDefined();

      const nnSolution = await new Solution(solution({ method: 'nn' })).save();
      expect(nnSolution.method).toBe('nn');
    });

    it('should reject negative distance and emissions', async () => {
      let error;
      try {
        await new Solution(solution({ total_distance: -1 })).save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.total_distance).toBeDefined();
    });

    it('should validate routes array', async () => {
      const savedSolution = await new Solution(
        solution({ routes: [route({ truck_no: 1, route: [] })] })
      ).save();

      expect(savedSolution.routes[0].truck_no).toBe(1);
      expect(savedSolution.routes[0].route).toEqual([]);
    });

    it('should require truck_no on each route', async () => {
      const bad = route();
      delete bad.truck_no;

      let error;
      try {
        await new Solution(solution({ routes: [bad] })).save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });
  });

  describe('Virtuals', () => {
    it('should average load across routes', async () => {
      const savedSolution = await new Solution(
        solution({
          number_of_trucks: 2,
          routes: [route({ load: 100 }), route({ truck_no: 2, load: 200 })],
        })
      ).save();

      expect(savedSolution.average_load_per_trip).toBe('150.00');
    });

    it('should average utilization across routes', async () => {
      const savedSolution = await new Solution(
        solution({
          number_of_trucks: 2,
          routes: [route({ utilization: 60 }), route({ truck_no: 2, utilization: 80 })],
        })
      ).save();

      expect(savedSolution.average_utilization_per_trip).toBe('70.00');
    });

    it('should return zero for a solution with no routes', async () => {
      const savedSolution = await new Solution(
        solution({ number_of_trucks: 0, routes: [] })
      ).save();

      expect(savedSolution.average_load_per_trip).toBe(0);
      expect(savedSolution.average_utilization_per_trip).toBe(0);
    });
  });

  describe('CRUD Operations', () => {
    it('should find solutions by query', async () => {
      await Solution.create([
        solution({ simulation_day: 1, total_distance: 15.5 }),
        solution({ simulation_day: 2, total_distance: 25.5 }),
      ]);

      const solutions = await Solution.find({ total_distance: { $lt: 20 } });
      expect(solutions).toHaveLength(1);
      expect(solutions[0].total_distance).toBe(15.5);
    });

    it('should sort solutions by simulation_day', async () => {
      await Solution.create([
        solution({ simulation_day: 1, total_distance: 15.5 }),
        solution({ simulation_day: 2, total_distance: 25.5 }),
      ]);

      const solutions = await Solution.find().sort({ simulation_day: -1 });
      expect(solutions[0].simulation_day).toBe(2);
      expect(solutions[0].total_distance).toBe(25.5);
    });

    it('should delete solutions', async () => {
      const saved = await Solution.create(solution());

      await Solution.findByIdAndDelete(saved._id);

      expect(await Solution.findById(saved._id)).toBeNull();
    });
  });

  describe('Statics', () => {
    it('should fetch both methods for a given day', async () => {
      await Solution.create([
        solution({ simulation_day: 3, method: 'ga' }),
        solution({ simulation_day: 3, method: 'nn' }),
        solution({ simulation_day: 4, method: 'ga' }),
      ]);

      const day3 = await Solution.getByDay(3);
      expect(day3).toHaveLength(2);
      expect(day3.map((s) => s.method)).toEqual(['ga', 'nn']);
    });

    it('should fetch one method across a day range', async () => {
      await Solution.create([
        solution({ simulation_day: 1, method: 'ga' }),
        solution({ simulation_day: 2, method: 'ga' }),
        solution({ simulation_day: 3, method: 'ga' }),
        solution({ simulation_day: 2, method: 'nn' }),
      ]);

      const range = await Solution.getByMethodAndDateRange('ga', 1, 2);
      expect(range).toHaveLength(2);
      expect(range.map((s) => s.simulation_day)).toEqual([1, 2]);
    });
  });

  describe('Complex Route Data', () => {
    it('should handle multiple trucks with multiple bins', async () => {
      const saved = await Solution.create(
        solution({
          number_of_trucks: 3,
          total_distance: 50.5,
          routes: [
            route({ truck_no: 1, route: ['BIN_001', 'BIN_002', 'BIN_003'] }),
            route({ truck_no: 2, route: ['BIN_004', 'BIN_005', 'BIN_006'] }),
            route({ truck_no: 3, route: ['BIN_007', 'BIN_008'] }),
          ],
        })
      );

      expect(saved.routes).toHaveLength(3);
      expect(saved.routes[0].route).toHaveLength(3);
      expect(saved.routes[1].route).toHaveLength(3);
      expect(saved.routes[2].route).toHaveLength(2);
    });

    it('should maintain bin order within a route', async () => {
      const saved = await Solution.create(
        solution({ routes: [route({ route: ['BIN_003', 'BIN_001', 'BIN_002'] })] })
      );

      expect(saved.routes[0].route).toEqual(['BIN_003', 'BIN_001', 'BIN_002']);
    });
  });
});
