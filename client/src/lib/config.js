// API Configuration
// This will automatically use the correct backend URL based on environment
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Remove trailing slash if exists
export const BASE_API_URL = API_URL.replace(/\/$/, '');

// API Endpoints
export const API_ENDPOINTS = {
  // Bins endpoints
  bins: `${BASE_API_URL}/bins`,
  
  // Simulation endpoints
  simulation: {
    status: `${BASE_API_URL}/simulation/status`,
    initialize: `${BASE_API_URL}/simulation/initialize`,
    run: `${BASE_API_URL}/simulation/run`,
    clear: `${BASE_API_URL}/simulation/clear`,
  },
  
  // Solution/Analytics endpoints
  solutions: {
    base: `${BASE_API_URL}/solutions`,
    compare: `${BASE_API_URL}/solutions/compare`,
    summary: `${BASE_API_URL}/solutions/summary`,
  },
  
  // Tracking endpoints (different base path)
  tracking: {
    trucks: `${BASE_API_URL.replace('/api/v1', '/api')}/tracking/trucks`,
    checkin: `${BASE_API_URL.replace('/api/v1', '/api')}/tracking/checkin`,
  }
};
