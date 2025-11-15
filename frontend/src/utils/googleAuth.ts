import axios from 'axios';

const API_BASE_URL = 'http://localhost:8002/api/v1';

export const handleGoogleAuth = async (token: string, accountType: string = 'Patient') => {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/google`, {
      token,
      accountType
    }, {
      withCredentials: true
    });
    
    return response.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || 'Google authentication failed');
  }
};

export const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (document.querySelector('script[src*="accounts.google.com/gsi/client"]')) {
      resolve(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
};