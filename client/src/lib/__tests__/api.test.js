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

  describe('getRandomBins', () => {
    it('should fetch random bins', async () => {
      const mockBins = [{ id: 1 }];
      mockAxiosInstance.post.mockResolvedValue({ data: mockBins });
      const result = await api.getRandomBins(2);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/bins/random', { count: 2 });
    });
  });

  describe('optimizeRoutes', () => {
    it('should optimize routes', async () => {
      const mockResult = { routes: [[0, 1, 0]] };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResult });
      const result = await api.optimizeRoutes([]);
      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/optimize', { bins: [] });
    });
  });

  describe('getAllSolutions', () => {
    it('should fetch all solutions', async () => {
      const mockSolutions = [{ id: 1 }];
      mockAxiosInstance.get.mockResolvedValue({ data: mockSolutions });
      const result = await api.getAllSolutions();
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/solutions');
    });
  });

  describe('getSolutionById', () => {
    it('should fetch solution by ID', async () => {
      const mockSolution = { id: 1, routes: [] };
      mockAxiosInstance.get.mockResolvedValue({ data: mockSolution });
      const result = await api.getSolutionById(1);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/solutions/1');
    });
  });
});

