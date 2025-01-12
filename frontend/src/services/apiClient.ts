import axios, { AxiosError } from 'axios';
import { logger } from '../utils/logger';
import { ReactionDTO } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track if we're currently refreshing to prevent loops
let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

const waitForClerkInit = async (maxAttempts = 50, interval = 100): Promise<void> => {
  for (let i = 0; i < maxAttempts; i++) {
    if (window.Clerk?.session) {
      return;
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  throw new Error('Clerk initialization timeout');
};

// Add backoff utility
const backoff = {
  attempts: 0,
  maxAttempts: 5,
  baseDelay: 1000,
  reset() {
    this.attempts = 0;
  },
  nextDelay() {
    if (this.attempts >= this.maxAttempts) {
      return null;
    }
    const delay = Math.min(this.baseDelay * Math.pow(2, this.attempts), 30000);
    this.attempts++;
    return delay;
  }
};

// Update getValidToken with backoff
const getValidToken = async (): Promise<string | null> => {
  try {
    await waitForClerkInit();
    const token = await window.Clerk?.session?.getToken();
    if (token) {
      backoff.reset(); // Reset backoff on successful token fetch
      return token;
    }
    return null;
  } catch (error) {
    logger.error('clerk', 'Failed to get valid token', error);
    return null;
  }
};

// Add auth token to every request
apiClient.interceptors.request.use(async (config) => {
  try {
    logger.debug('api', `🌐 Request starting: ${config.method?.toUpperCase()} ${config.url}`, {
      headers: config.headers,
      params: config.params,
      data: config.data,
    });

    const token = await getValidToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      logger.debug('clerk', '🔑 Added auth token to request');
    } else {
      logger.warn('clerk', '⚠️ No auth token available');
    }
  } catch (error) {
    logger.error('clerk', '❌ Error getting auth token', error);
  }
  return config;
});

// Handle responses and errors with token refresh
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
  async (error: AxiosError) => {
    if (error.response) {
      logger.error('api', `❌ Response error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });

      // Handle 401 errors with token refresh and backoff
      if (error.response.status === 401 && error.config) {
        try {
          // If we're already refreshing, wait for that to complete
          if (isRefreshing) {
            if (refreshPromise) {
              const token = await refreshPromise;
              if (token) {
                // Create a new config object to avoid mutation
                const newConfig = { ...error.config };
                newConfig.headers = new axios.AxiosHeaders(error.config.headers);
                newConfig.headers.set('Authorization', `Bearer ${token}`);
                return apiClient.request(newConfig);
              }
            }
            throw new Error('Token refresh failed');
          }

          // Check if we should attempt another retry
          const delay = backoff.nextDelay();
          if (!delay) {
            logger.error('clerk', 'Max retry attempts reached');
            window.location.href = '/sign-in';
            return Promise.reject(error);
          }

          // Wait for backoff delay
          await new Promise(resolve => setTimeout(resolve, delay));
          
          // Start a new refresh
          isRefreshing = true;
          refreshPromise = getValidToken();
          
          logger.debug('clerk', '🔄 Attempting to refresh token');
          const token = await refreshPromise;
          
          if (token) {
            logger.debug('clerk', '✨ Token refreshed successfully');
            // Create a new config object to avoid mutation
            const newConfig = { ...error.config };
            newConfig.headers = new axios.AxiosHeaders(error.config.headers);
            newConfig.headers.set('Authorization', `Bearer ${token}`);
            return apiClient.request(newConfig);
          } else {
            logger.warn('clerk', '🚫 No new token available after refresh attempt');
            window.location.href = '/sign-in';
          }
        } catch (refreshError) {
          logger.error('clerk', '❌ Token refresh failed', refreshError);
          window.location.href = '/sign-in';
        } finally {
          isRefreshing = false;
          refreshPromise = null;
        }
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

// Add reaction endpoints
export const addReaction = async (messageId: string, emoji: string): Promise<ReactionDTO> => {
  const response = await apiClient.post(`/messages/${messageId}/reactions`, null, { params: { emoji } });
  return response.data;
};

export const removeReaction = async (messageId: string, emoji: string): Promise<void> => {
  await apiClient.delete(`/messages/${messageId}/reactions/${emoji}`);
};

export const getReactions = async (messageId: string): Promise<ReactionDTO[]> => {
  const response = await apiClient.get(`/messages/${messageId}/reactions`);
  return response.data;
};

export const getReactionsForMessages = async (messageIds: string[]): Promise<Record<string, ReactionDTO[]>> => {
  const response = await apiClient.post(`/messages/reactions/batch`, { messageIds });
  return response.data;
};

export default apiClient; 