/**
 * Axios Configuration with API Key Authentication
 * 
 * IMPORTANT: In production, store API_KEY in environment variables,
 * not in code. Use .env file for local development.
 */

import axios from 'axios';

// Get API key from environment variable
const API_KEY = import.meta.env.VITE_API_KEY || 'my_super_secret_key';
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

// Create axios instance with default config
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000, // 30 second timeout
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor - Add API key to all requests
apiClient.interceptors.request.use(
    (config) => {
        // Add API key header
        config.headers['X-API-KEY'] = API_KEY;

        // Add Bearer Token from LocalStorage
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }

        // Log request in development
        if (import.meta.env.DEV) {
            console.log(`[API] ${config.method.toUpperCase()} ${config.url}`);
        }

        return config;
    },
    (error) => {
        console.error('[API] Request error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor - Handle errors
apiClient.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        if (error.response) {
            // Handle specific status codes
            switch (error.response.status) {
                case 401:
                    console.error('[API] Unauthorized - Invalid API key');
                    // Could redirect to login or show error modal
                    break;
                case 403:
                    console.error('[API] Forbidden');
                    break;
                case 429:
                    console.error('[API] Rate limit exceeded - Please wait');
                    // Could show user-friendly message
                    break;
                case 500:
                    console.error('[API] Server error');
                    break;
                default:
                    console.error(`[API] Error ${error.response.status}:`, error.response.data);
            }
        } else if (error.request) {
            console.error('[API] No response received:', error.request);
        } else {
            console.error('[API] Request setup error:', error.message);
        }

        return Promise.reject(error);
    }
);

// Helper functions for common requests
export const api = {
    // GET request
    get: (url, config = {}) => apiClient.get(url, config),

    // POST request
    post: (url, data = {}, config = {}) => apiClient.post(url, data, config),

    // PUT request
    put: (url, data = {}, config = {}) => apiClient.put(url, data, config),

    // DELETE request
    delete: (url, config = {}) => apiClient.delete(url, config),
};

export default apiClient;
