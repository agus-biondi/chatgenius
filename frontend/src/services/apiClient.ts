import axios from 'axios';
import { logger } from '../utils/logger';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    logger.debug('api', `🌐 Request starting: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data,
    });

    const token = await window.Clerk?.session?.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('clerk', '🔑 Added auth token to request');
    } else {
      logger.warn('clerk', '⚠️ No auth token available');
    }
  } catch (error) {
    logger.error('clerk', '❌ Error getting auth token:', error);
  }
  return config;
});

// Handle responses and errors
apiClient.interceptors.response.use(
  (response) => {
    logger.info('api', `✅ Response received: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
      status: response.status,
      statusText: response.statusText,
      data: response.data,
      headers: response.headers,
    });
    return response;
  },
  (error) => {
    if (error.response) {
      logger.error('api', `❌ Response error: ${error.config.method?.toUpperCase()} ${error.config.url}`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });

      if (error.response.status === 401) {
        logger.warn('clerk', '🚫 Unauthorized request, redirecting to sign-in');
        window.location.href = '/sign-in';
      }
    } else if (error.request) {
      logger.error('api', '❌ Request error: No response received', {
        request: error.request,
      });
    } else {
      logger.error('api', '❌ Error setting up request', {
        message: error.message,
      });
    }
    return Promise.reject(error);
  }
);

export default apiClient; 