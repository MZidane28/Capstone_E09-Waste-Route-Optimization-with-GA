import axios from 'axios';

jest.mock('axios');

describe('API Module Tests', () => {
  let api;
  let mockAxiosInstance;

  beforeAll(async () => {
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };
    axios.create.mockReturnValue(mockAxiosInstance);
    api = await import('../api');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllBins', () => {
    it('should fetch all bins successfully', async () => {
      const mockData = [{ id: 1, name: 'Bin 1' }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });
      const result = await api.getAllBins();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bins');
      expect(result).toEqual({ data: mockData });
    });
  });

  describe('getBinById', () => {
    it('should fetch bin by ID', async () => {
      const mockBin = { id: 1, name: 'Bin 1' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockBin });
      const result = await api.getBinById(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bins/1');
    });
  });

  describe('createBin', () => {
    it('should create a new bin', async () => {
      const newBin = { name: 'New Bin' };
      mockAxiosInstance.post.mockResolvedValue({ data: { id: 1, ...newBin } });
      const result = await api.createBin(newBin);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/bins', newBin);
    });
  });

  describe('updateBin', () => {
    it('should update a bin', async () => {
      const updates = { name: 'Updated' };
      mockAxiosInstance.put.mockResolvedValue({ data: { id: 1, ...updates } });
      const result = await api.updateBin(1, updates);
      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/bins/1', updates);
    });
  });

  describe('deleteBin', () => {
    it('should delete a bin', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { success: true } });
      const result = await api.deleteBin(1);
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/bins/1');
    });
  });

  describe('getTrashBins', () => {
    it('should stay a legacy alias of getAllBins', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      await api.getTrashBins();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/bins');
      expect(api.getTrashBins).toBe(api.getAllBins);
    });
  });

  describe('simulation endpoints', () => {
    it('should fetch simulation status', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: { day: 3 } });
      await api.getSimulationStatus();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/simulation/status');
    });

    it('should initialize without clearing history by default', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { ok: true } });
      await api.initializeSimulation();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/simulation/initialize', {
        clearHistory: false,
      });
    });

    it('should pass the clearHistory flag through', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { ok: true } });
      await api.initializeSimulation(true);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/simulation/initialize', {
        clearHistory: true,
      });
    });

    it('should run a simulation day', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { day: 4 } });
      await api.runSimulationDay();
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/simulation/run');
    });

    it('should clear simulation history', async () => {
      mockAxiosInstance.delete.mockResolvedValue({ data: { ok: true } });
      await api.clearSimulationHistory();
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/simulation/clear');
    });
  });

  describe('solution endpoints', () => {
    it('should fetch solutions with no filters by default', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      await api.getSolutions();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/solutions', { params: {} });
    });

    it('should forward query params when fetching solutions', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: [] });
      await api.getSolutions({ method: 'ga', day: 2 });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/solutions', {
        params: { method: 'ga', day: 2 },
      });
    });

    it('should fetch the GA vs NN comparison', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });
      await api.compareSolutions({ from: 1, to: 5 });
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/solutions/compare', {
        params: { from: 1, to: 5 },
      });
    });

    it('should fetch the solutions summary', async () => {
      mockAxiosInstance.get.mockResolvedValue({ data: {} });
      await api.getSolutionsSummary();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/solutions/summary');
    });
  });
});

