import axios from "axios";

const API = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// ============================================
// BINS ENDPOINTS
// ============================================
export const getAllBins = () => API.get("/bins");
export const getBinById = (id) => API.get(`/bins/${id}`);
export const createBin = (data) => API.post("/bins", data);
export const updateBin = (id, data) => API.put(`/bins/${id}`, data);
export const deleteBin = (id) => API.delete(`/bins/${id}`);

// Legacy alias
export const getTrashBins = getAllBins;

// ============================================
// SIMULATION ENDPOINTS
// ============================================
export const getSimulationStatus = () => API.get("/simulation/status");
export const initializeSimulation = (clearHistory = false) => 
  API.post("/simulation/initialize", { clearHistory });
export const runSimulationDay = () => API.post("/simulation/run");
export const clearSimulationHistory = () => API.delete("/simulation/clear");

// ============================================
// SOLUTION/ANALYTICS ENDPOINTS
// ============================================
export const getSolutions = (params = {}) => API.get("/solutions", { params });
export const compareSolutions = (params = {}) => API.get("/solutions/compare", { params });
export const getSolutionsSummary = () => API.get("/solutions/summary"); 