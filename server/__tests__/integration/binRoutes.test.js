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
          demand: 75,
          is_real: false,
        },
      ]);

      const response = await request(app).get('/api/v1/bins');

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('location');
    });
  });

  describe('GET /api/v1/bins/:id', () => {
    it('should get a bin by ID', async () => {
      const bin = await Bin.create({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 60,
        is_real: true,
      });

      const response = await request(app).get(`/api/v1/bins/${bin._id}`);

      expect(response.status).toBe(200);
      expect(response.body.name).toBe('Test Bin');
      expect(response.body.demand).toBe(60);
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
        name: 'New Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 55,
        is_real: true,
      };

      const response = await request(app)
        .post('/api/v1/bins')
        .send(newBin);

      expect(response.status).toBe(201);
      expect(response.body.statusCode).toBe(201);
      expect(response.body.message).toBe('Bin created successfully');
      expect(response.body.data.name).toBe('New Bin');
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
  });

  describe('PUT /api/v1/bins/:id', () => {
    it('should update a bin', async () => {
      const bin = await Bin.create({
        name: 'Original Name',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      const updates = {
        name: 'Updated Name',
        demand: 85,
      };

      const response = await request(app)
        .put(`/api/v1/bins/${bin._id}`)
        .send(updates);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bin updated successfully');
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.demand).toBe(85);

      // Verify last_update was updated
      expect(response.body.data.last_update).toBeDefined();
    });
  });

  describe('DELETE /api/v1/bins/:id', () => {
    it('should delete a bin', async () => {
      const bin = await Bin.create({
        name: 'To Delete',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      const response = await request(app).delete(`/api/v1/bins/${bin._id}`);

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Bin deleted');

      // Verify deletion
      const deletedBin = await Bin.findById(bin._id);
      expect(deletedBin).toBeNull();
    });
  });

  describe('POST /api/v1/bins/random', () => {
    it('should return random bins', async () => {
      // Create test bins
      const bins = Array.from({ length: 20 }, (_, i) => ({
        name: `Bin ${i + 1}`,
        location: { lat: -6.2088 + i * 0.001, lon: 106.8456 + i * 0.001 },
        capacity: 100,
        demand: Math.floor(Math.random() * 100),
        is_real: true,
      }));

      await Bin.insertMany(bins);

      const response = await request(app)
        .post('/api/v1/bins/random')
        .send({ count: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveLength(10);
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should handle invalid count', async () => {
      const response = await request(app)
        .post('/api/v1/bins/random')
        .send({ count: -5 });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Please provide a valid count');
    });
  });
});

