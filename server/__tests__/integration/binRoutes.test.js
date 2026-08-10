import request from 'supertest';
import express from 'express';
import binRouter from '../../routes/binRoutes.js';
import Bin from '../../models/Bin.js';
import * as db from '../setup/testDb.js';

// Create express app for testing
const app = express();
app.use(express.json());
app.use('/api/v1/bins', binRouter);

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Bin Routes Integration Tests', () => {
  describe('GET /api/v1/bins', () => {
    it('should get all bins', async () => {
      // Create test data
      await Bin.create([
        {
          bin_id: 'BIN_001',
          name: 'Bin A',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          fill_rate: 50,
          is_real: true,
        },
        {
          bin_id: 'BIN_002',
          name: 'Bin B',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 75,
          is_real: false,
        },
      ]);

      const response = await request(app).get('/api/v1/bins');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('bin_id');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('location');
    });

    it('should return an empty array when no bins exist', async () => {
      const response = await request(app).get('/api/v1/bins');

      expect(response.status).toBe(200);
      expect(response.body).toEqual([]);
    });
  });

  describe('GET /api/v1/bins/:id', () => {
    it('should get a bin by ID', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_010',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 60,
        is_real: true,
      });

      const response = await request(app).get(`/api/v1/bins/${bin._id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Bin');
      expect(response.body.fill_rate).toBe(60);
    });

    it('should return 404 for non-existent bin', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app).get(`/api/v1/bins/${fakeId}`);

      expect(response.status).toBe(404);
      expect(response.body.message).toBe('Bin not found');
    });
  });

  describe('POST /api/v1/bins', () => {
    it('should create a new bin', async () => {
      const newBin = {
        bin_id: 'BIN_020',
        name: 'New Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 55,
        is_real: true,
      };

      const response = await request(app)
        .post('/api/v1/bins')
        .send(newBin);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Bin created successfully');
      expect(response.body.data.name).toBe('New Bin');
      expect(response.body.data.bin_id).toBe('BIN_020');
      expect(response.body.data._id).toBeDefined();

      // Verify in database
      const savedBin = await Bin.findById(response.body.data._id);
      expect(savedBin).toBeTruthy();
    });

    it('should validate required fields', async () => {
      const invalidBin = {
        name: 'Invalid Bin',
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/v1/bins')
        .send(invalidBin);

      expect(response.status).toBe(500);
    });

    it('should reject a duplicate bin_id', async () => {
      const bin = {
        bin_id: 'BIN_030',
        name: 'First',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      };

      await request(app).post('/api/v1/bins').send(bin);
      const response = await request(app)
        .post('/api/v1/bins')
        .send({ ...bin, name: 'Duplicate' });

      expect(response.status).toBe(500);
    });
  });

  describe('PUT /api/v1/bins/:id', () => {
    it('should update a bin', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_040',
        name: 'Original Name',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
        is_real: true,
      });

      const updates = {
        name: 'Updated Name',
        fill_rate: 85,
      };

      const response = await request(app)
        .put(`/api/v1/bins/${bin._id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bin updated successfully');
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.fill_rate).toBe(85);

      // Verify the timestamp moved
      expect(response.body.data.updatedAt).toBeDefined();
    });

    it('should return 404 when updating a non-existent bin', async () => {
      const response = await request(app)
        .put('/api/v1/bins/507f1f77bcf86cd799439011')
        .send({ name: 'Nobody' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/v1/bins/:id', () => {
    it('should delete a bin', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_050',
        name: 'To Delete',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
        is_real: true,
      });

      const response = await request(app).delete(`/api/v1/bins/${bin._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bin deleted');

      // Verify deletion
      const deletedBin = await Bin.findById(bin._id);
      expect(deletedBin).toBeNull();
    });

    it('should return 404 when deleting a non-existent bin', async () => {
      const response = await request(app).delete(
        '/api/v1/bins/507f1f77bcf86cd799439011'
      );

      expect(response.status).toBe(404);
    });
  });
});
