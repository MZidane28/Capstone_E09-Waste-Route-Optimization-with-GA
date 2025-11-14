import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1",
});

const TRACKING_API = axios.create({
  baseURL: (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1").replace('/v1', '') + '/tracking',
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

// ==================== TRACKING ENDPOINTS ====================
// Get all trucks
export const getAllTrucks = () => TRACKING_API.get("/trucks");

// Get truck by ID
export const getTruckById = (id) => TRACKING_API.get(`/trucks/${id}`);

// Create truck
export const createTruck = (truckData) => TRACKING_API.post("/trucks", truckData);

// Update truck status
export const updateTruckStatus = (id, statusData) => TRACKING_API.put(`/trucks/${id}/status`, statusData);

// Add check-in
export const addCheckIn = (id, checkInData) => TRACKING_API.post(`/trucks/${id}/checkin`, checkInData);

// Assign route
export const assignRoute = (id, routeData) => TRACKING_API.put(`/trucks/${id}/route`, routeData);

// Reset truck
export const resetTruck = (id) => TRACKING_API.put(`/trucks/${id}/reset`);

// Delete truck
export const deleteTruck = (id) => TRACKING_API.delete(`/trucks/${id}`);

// ==================== LEGACY (untuk backward compatibility) ====================
export const getTrashBins = getAllBins;
export const getOptimizedRoute = () => API.get("/route"); 