import { useAuth } from '@clerk/clerk-react';

export const getAuthHeader = async () => {
  const token = await window.Clerk?.session?.getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const useAuthHeaders = () => {
  const { getToken } = useAuth();
  
  const getHeaders = async () => {
    const token = await getToken();
    return {
      Authorization: token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json',
    };
  };

  return { getHeaders };
}; 