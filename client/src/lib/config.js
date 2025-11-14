// API Configuration
// This will automatically use the correct backend URL based on environment
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

// Remove trailing slash if exists
export const BASE_API_URL = API_URL.replace(/\/$/, '');

// API Endpoints
export const API_ENDPOINTS = {
  bins: `${BASE_API_URL}/bins`,
  optimize: `${BASE_API_URL}/optimize`,
  tracking: {
    trucks: `${BASE_API_URL.replace('/api/v1', '/api')}/tracking/trucks`,
    checkin: `${BASE_API_URL.replace('/api/v1', '/api')}/tracking/checkin`,
  }
};
