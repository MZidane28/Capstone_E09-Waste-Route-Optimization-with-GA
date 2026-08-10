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
        bin_id: 'BIN_001',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
        is_real: true,
      };

      const bin = new Bin(binData);
      const savedBin = await bin.save();

      expect(savedBin._id).toBeDefined();
      expect(savedBin.bin_id).toBe('BIN_001');
      expect(savedBin.name).toBe('Test Bin');
      expect(savedBin.location.lat).toBe(-6.2088);
      expect(savedBin.location.lon).toBe(106.8456);
      expect(savedBin.capacity).toBe(100);
      expect(savedBin.fill_rate).toBe(50);
      expect(savedBin.is_real).toBe(true);
      expect(savedBin.createdAt).toBeDefined();
    });

    it('should require bin_id field', async () => {
      const binWithoutId = new Bin({
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      let error;
      try {
        await binWithoutId.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.bin_id).toBeDefined();
    });

    it('should require name field', async () => {
      const binWithoutName = new Bin({
        bin_id: 'BIN_002',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
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
        bin_id: 'BIN_003',
        name: 'Test Bin',
        capacity: 100,
        fill_rate: 50,
      });

      let error;
      try {
        await binWithoutLocation.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors['location.lat']).toBeDefined();
      expect(error.errors['location.lon']).toBeDefined();
    });

    it('should default capacity to 100 when omitted', async () => {
      const bin = new Bin({
        bin_id: 'BIN_004',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        fill_rate: 50,
      });

      const savedBin = await bin.save();
      expect(savedBin.capacity).toBe(100);
    });

    it('should default fill_rate to 10 when omitted', async () => {
      const bin = new Bin({
        bin_id: 'BIN_005',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
      });

      const savedBin = await bin.save();
      expect(savedBin.fill_rate).toBe(10);
    });

    it('should default fill levels to zero', async () => {
      const bin = new Bin({
        bin_id: 'BIN_006',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      const savedBin = await bin.save();
      expect(savedBin.current_fill_ga).toBe(0);
      expect(savedBin.current_fill_nn).toBe(0);
    });

    it('should have default is_real value as false', async () => {
      const bin = new Bin({
        bin_id: 'BIN_007',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      const savedBin = await bin.save();
      expect(savedBin.is_real).toBe(false); // Default is false per model
    });

    it('should set timestamps automatically', async () => {
      const bin = new Bin({
        bin_id: 'BIN_008',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      const beforeSave = Date.now();
      const savedBin = await bin.save();
      const afterSave = Date.now();

      expect(savedBin.createdAt.getTime()).toBeGreaterThanOrEqual(beforeSave);
      expect(savedBin.createdAt.getTime()).toBeLessThanOrEqual(afterSave);
      expect(savedBin.updatedAt).toBeDefined();
    });
  });

  describe('Location Validation', () => {
    it('should validate location coordinates', async () => {
      const bin = new Bin({
        bin_id: 'BIN_010',
        name: 'Test Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
      });

      const savedBin = await bin.save();
      expect(savedBin.location).toBeDefined();
      expect(savedBin.location.lat).toBe(-6.2088);
      expect(savedBin.location.lon).toBe(106.8456);
    });
  });

  describe('Fill Level Methods', () => {
    it('should report fill percentage per method', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_020',
        name: 'Fill Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 200,
        fill_rate: 10,
        current_fill_ga: 100,
        current_fill_nn: 50,
      });

      expect(bin.getFillPercentage('ga')).toBe(50);
      expect(bin.getFillPercentage('nn')).toBe(25);
    });

    it('should empty a bin for the given method', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_021',
        name: 'Empty Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 10,
        current_fill_ga: 90,
        current_fill_nn: 40,
      });

      bin.emptyBin('ga');

      expect(bin.current_fill_ga).toBe(0);
      expect(bin.current_fill_nn).toBe(40); // untouched
    });

    it('should flag bins that need collection', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_022',
        name: 'Full Bin',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 10,
        current_fill_ga: 85,
      });

      expect(bin.needsCollection()).toBe(true);
      expect(bin.needsCollection(90)).toBe(false);
    });
  });

  describe('CRUD Operations', () => {
    it('should find bins by query', async () => {
      await Bin.create([
        {
          bin_id: 'BIN_030',
          name: 'Real Bin',
          location: { lat: -6.2088, lon: 106.8456 },
          capacity: 100,
          fill_rate: 50,
          is_real: true,
        },
        {
          bin_id: 'BIN_031',
          name: 'Mock Bin',
          location: { lat: -6.2089, lon: 106.8457 },
          capacity: 100,
          fill_rate: 75,
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
        bin_id: 'BIN_040',
        name: 'Original',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
        is_real: true,
      });

      bin.name = 'Updated';
      bin.fill_rate = 80;
      const updatedBin = await bin.save();

      expect(updatedBin.name).toBe('Updated');
      expect(updatedBin.fill_rate).toBe(80);
    });

    it('should delete bins', async () => {
      const bin = await Bin.create({
        bin_id: 'BIN_050',
        name: 'To Delete',
        location: { lat: -6.2088, lon: 106.8456 },
        capacity: 100,
        fill_rate: 50,
        is_real: true,
      });

      await Bin.findByIdAndDelete(bin._id);

      const deletedBin = await Bin.findById(bin._id);
      expect(deletedBin).toBeNull();
    });
  });
});
