import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
});

// ==================== BIN ENDPOINTS ====================
// Get all bins
export const getAllBins = () => API.get("/bins");

// Get bin by ID
export const getBinById = (id) => API.get(`/bins/${id}`);

// Create new bin
export const createBin = (binData) => API.post("/bins", binData);

// Update bin
export const updateBin = (id, binData) => API.put(`/bins/${id}`, binData);

// Delete bin
export const deleteBin = (id) => API.delete(`/bins/${id}`);

// Get random bins
export const getRandomBins = (count) => API.post("/bins/random", { count });

// ==================== OPTIMIZE ENDPOINTS ====================
// Optimize routes with selected bins
export const optimizeRoutes = (bins) => API.post("/optimize", { bins });

// ==================== SOLUTION ENDPOINTS ====================
// Get all solutions
export const getAllSolutions = () => API.get("/solutions");

// Get solution by ID
export const getSolutionById = (id) => API.get(`/solutions/${id}`);

// ==================== LEGACY (untuk backward compatibility) ====================
export const getTrashBins = getAllBins;
export const getOptimizedRoute = () => API.get("/route"); 