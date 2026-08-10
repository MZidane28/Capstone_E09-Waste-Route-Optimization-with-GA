import { jest } from '@jest/globals';
import Bin from '../../models/Bin.js';
import {
  getAllBins,
  getBinById,
  createBin,
  updateBin,
  deleteBin,
} from '../../controllers/binController.js';
import * as db from '../setup/testDb.js';

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Bin Controller Tests', () => {
  // Mock request and response objects
  let req, res;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getAllBins', () => {
    it('should return all bins', async () => {
      // Create test bins
      const testBins = [
        {
          bin_id: 'BIN_001',
          name: 'Bin 1',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          fill_rate: 50,
          is_real: true,
        },
        {
          bin_id: 'BIN_002',
          name: 'Bin 2',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 75,
          is_real: false,
        },
      ];

      await Bin.insertMany(testBins);

      await getAllBins(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalled();
      const response = res.json.mock.calls[0][0];
      expect(response).toHaveLength(2);
      expect(response[0].name).toBe('Bin 1');
    });

    it('should return empty array when no bins exist', async () => {
      await getAllBins(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should handle errors gracefully', async () => {
      // Mock Bin.find to throw error
      jest.spyOn(Bin, 'find').mockRejectedValueOnce(new Error('Database error'));

      await getAllBins(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching bins',
        error: 'Database error',
      });
    });
  });

  describe('getBinById', () => {
    it('should return a bin by ID', async () => {
      const testBin = await Bin.create({
        bin_id: 'BIN_010',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 60,
        is_real: true,
      });

      req.params.id = testBin._id.toString();

      await getBinById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.name).toBe('Test Bin');
      expect(response.fill_rate).toBe(60);
    });

    it('should return 404 if bin not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011'; // Valid ObjectId format

      await getBinById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Bin not found' });
    });

    it('should handle invalid ID format', async () => {
      req.params.id = 'invalid-id';

      await getBinById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('createBin', () => {
    it('should create a new bin', async () => {
      req.body = {
        bin_id: 'BIN_020',
        name: 'New Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 45,
        is_real: true,
      };

      await createBin(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);
      expect(response.message).toBe('Bin created successfully');
      expect(response.data.name).toBe('New Bin');

      // Verify bin was saved to database
      const savedBin = await Bin.findOne({ name: 'New Bin' });
      expect(savedBin).toBeTruthy();
      expect(savedBin.bin_id).toBe('BIN_020');
      expect(savedBin.fill_rate).toBe(45);
    });

    it('should handle validation errors', async () => {
      req.body = {
        // Missing required fields
        name: 'Invalid Bin',
      };

      await createBin(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('updateBin', () => {
    it('should update a bin', async () => {
      const testBin = await Bin.create({
        bin_id: 'BIN_030',
        name: 'Old Name',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
        is_real: true,
      });

      req.params.id = testBin._id.toString();
      req.body = {
        name: 'Updated Name',
        fill_rate: 80,
      };

      await updateBin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Bin updated successfully');
      expect(response.data.name).toBe('Updated Name');
      expect(response.data.fill_rate).toBe(80);
    });

    it('should return 404 if bin not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011';
      req.body = { name: 'Updated' };

      await updateBin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteBin', () => {
    it('should delete a bin', async () => {
      const testBin = await Bin.create({
        bin_id: 'BIN_040',
        name: 'To Delete',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
        is_real: true,
      });

      req.params.id = testBin._id.toString();

      await deleteBin(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const response = res.json.mock.calls[0][0];
      expect(response.message).toBe('Bin deleted');

      // Verify bin was deleted
      const deletedBin = await Bin.findById(testBin._id);
      expect(deletedBin).toBeNull();
    });

    it('should return 404 if bin not found', async () => {
      req.params.id = '507f1f77bcf86cd799439011';

      await deleteBin(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});
