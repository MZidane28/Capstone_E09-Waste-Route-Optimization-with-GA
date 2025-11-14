import { jest } from '@jest/globals';
import mongoose from 'mongoose';
import { optimizeRoutes } from '../../controllers/optimizeController.js';
import Solution from '../../models/Solution.js';
import * as db from '../setup/testDb.js';

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

// Mock fetch
global.fetch = jest.fn();

describe('Optimize Controller Tests', () => {
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('optimizeRoutes', () => {
    const mockBins = [
      {
        id: 'bin1',
        name: 'Bin 1',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
      },
      {
        id: 'bin2',
        name: 'Bin 2',
        location: { lat: -6.2089, lon: 106.8457 },
        capacity: 100,
        demand: 75,
      },
      {
        id: 'bin3',
        name: 'Bin 3',
        location: { lat: -6.2090, lon: 106.8458 },
        capacity: 100,
        demand: 60,
      },
    ];

    const mockGAResponse = {
      total_distance: 15.5,
      total_time: 0.3875,
      utilization: 85.5,
      emissions: 3.1,
      trucks: [
        {
          truck_no: 1,
          distance: 8.2,
          load: 125,
          bins: [
            { bin_id: new mongoose.Types.ObjectId(), visit_order: 1, demand: 50 },
            { bin_id: new mongoose.Types.ObjectId(), visit_order: 2, demand: 75 },
          ],
        },
        {
          truck_no: 2,
          distance: 7.3,
          load: 60,
          bins: [{ bin_id: new mongoose.Types.ObjectId(), visit_order: 1, demand: 60 }],
        },
      ],
    };

    it('should successfully optimize routes with GA service', async () => {
      req.body = {
        bins: mockBins,
        num_trucks: 2,
        population_size: 50,
        generations: 100,
      };

      // Mock successful GA service response
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGAResponse,
      });

      await optimizeRoutes(req, res);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/run_ga'),
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      
      expect(response.success).toBe(true);
      expect(response.message).toBe('Optimization completed successfully');
      expect(response.data.total_distance).toBe(15.5);
      expect(response.data.num_trucks).toBe(2);
      expect(response.solution_id).toBeDefined();

      // Verify solution was saved to database
      const savedSolution = await Solution.findById(response.solution_id);
      expect(savedSolution).toBeTruthy();
      expect(savedSolution.total_distance).toBe(15.5);
      expect(savedSolution.trucks).toHaveLength(2);
    });

    it('should return 400 if no bins are selected', async () => {
      req.body = {
        bins: [],
        num_trucks: 2,
      };

      await optimizeRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'No bins selected',
      });
    });

    it('should use default values if not provided', async () => {
      req.body = {
        bins: mockBins,
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockGAResponse,
      });

      await optimizeRoutes(req, res);

      const fetchCall = global.fetch.mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      
      expect(requestBody.num_trucks).toBe(3);
      expect(requestBody.population_size).toBe(100);
      expect(requestBody.generations).toBe(500);
    });

    it('should handle GA service error', async () => {
      req.body = {
        bins: mockBins,
        num_trucks: 2,
      };

      global.fetch.mockResolvedValueOnce({
        ok: false,
        statusText: 'Internal Server Error',
      });

      await optimizeRoutes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('GA Service error'),
        })
      );
    });

    it('should return mock data if GA service is unavailable', async () => {
      req.body = {
        bins: mockBins,
        num_trucks: 2,
      };

      // Mock fetch failure (service not available)
      global.fetch.mockRejectedValueOnce(new Error('fetch failed'));

      await optimizeRoutes(req, res);

      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      
      expect(response.success).toBe(false);
      expect(response.message).toContain('GA Service not available');
      expect(response.mock).toBe(true);
    });

    it('should calculate total_time from distance if not provided', async () => {
      req.body = {
        bins: mockBins,
        num_trucks: 2,
      };

      const responseWithoutTime = { ...mockGAResponse };
      delete responseWithoutTime.total_time;

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => responseWithoutTime,
      });

      await optimizeRoutes(req, res);

      const savedSolution = await Solution.findOne({});
      expect(savedSolution.total_time).toBeCloseTo(15.5 / 40, 5);
    });
  });
});


