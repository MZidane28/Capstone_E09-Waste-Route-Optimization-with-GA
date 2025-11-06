import Bin from '../../models/Bin.js';
import * as db from '../setup/testDb.js';

// Setup test database
beforeAll(async () => await db.connect());
afterEach(async () => await db.clearDatabase());
afterAll(async () => await db.closeDatabase());

describe('Bin Model Tests', () => {
  describe('Schema Validation', () => {
    it('should create a valid bin', async () => {
      const binData = {
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      };

      const bin = new Bin(binData);
      const savedBin = await bin.save();

      expect(savedBin._id).toBeDefined();
      expect(savedBin.name).toBe('Test Bin');
      expect(savedBin.location.lat).toBe(-6.2088);
      expect(savedBin.location.lon).toBe(106.8456);
      expect(savedBin.capacity).toBe(100);
      expect(savedBin.demand).toBe(50);
      expect(savedBin.is_real).toBe(true);
      expect(savedBin.last_update).toBeDefined();
    });

    it('should require name field', async () => {
      const binWithoutName = new Bin({
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
      });

      let error;
      try {
        await binWithoutName.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.name).toBeDefined();
    });

    it('should require location field', async () => {
      const binWithoutLocation = new Bin({
        name: 'Test Bin',
        capacity: 100,
        demand: 50,
      });

      let error;
      try {
        await binWithoutLocation.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
    });

    it('should require capacity field', async () => {
      const binWithoutCapacity = new Bin({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        demand: 50,
      });

      let error;
      try {
        await binWithoutCapacity.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.capacity).toBeDefined();
    });

    it('should require demand field', async () => {
      const binWithoutDemand = new Bin({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
      });

      let error;
      try {
        await binWithoutDemand.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.demand).toBeDefined();
    });

    it('should have default is_real value as false', async () => {
      const bin = new Bin({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
      });

      const savedBin = await bin.save();
      expect(savedBin.is_real).toBe(false); // Default is false per model
    });

    it('should set last_update automatically', async () => {
      const bin = new Bin({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
      });

      const beforeSave = Date.now();
      const savedBin = await bin.save();
      const afterSave = Date.now();

      expect(savedBin.last_update.getTime()).toBeGreaterThanOrEqual(beforeSave);
      expect(savedBin.last_update.getTime()).toBeLessThanOrEqual(afterSave);
    });
  });

  describe('Location Validation', () => {
    it('should validate location coordinates', async () => {
      const bin = new Bin({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
      });

      const savedBin = await bin.save();
      expect(savedBin.location).toBeDefined();
      expect(savedBin.location.lat).toBe(-6.2088);
      expect(savedBin.location.lon).toBe(106.8456);
    });
  });

  describe('CRUD Operations', () => {
    it('should find bins by query', async () => {
      await Bin.create([
        {
          name: 'Real Bin',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          demand: 50,
          is_real: true,
        },
        {
          name: 'Mock Bin',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          demand: 75,
          is_real: false,
        },
      ]);

      const realBins = await Bin.find({ is_real: true });
      expect(realBins).toHaveLength(1);
      expect(realBins[0].name).toBe('Real Bin');

      const mockBins = await Bin.find({ is_real: false });
      expect(mockBins).toHaveLength(1);
      expect(mockBins[0].name).toBe('Mock Bin');
    });

    it('should update bin fields', async () => {
      const bin = await Bin.create({
        name: 'Original',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      bin.name = 'Updated';
      bin.demand = 80;
      const updatedBin = await bin.save();

      expect(updatedBin.name).toBe('Updated');
      expect(updatedBin.demand).toBe(80);
    });

    it('should delete bins', async () => {
      const bin = await Bin.create({
        name: 'To Delete',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        demand: 50,
        is_real: true,
      });

      await Bin.findByIdAndDelete(bin._id);

      const deletedBin = await Bin.findById(bin._id);
      expect(deletedBin).toBeNull();
    });
  });
});

