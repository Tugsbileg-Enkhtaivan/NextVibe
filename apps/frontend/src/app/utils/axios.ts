import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.BASE_URL || 'http://localhost:8000',
  timeout: 40000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, 
});

export const createAuthenticatedApi = (sessionToken?: string) => {
  const authenticatedApi = axios.create({
    baseURL: process.env.BASE_URL  || 'http://localhost:8000',
    timeout: 40000,
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken && { Authorization: `Bearer ${sessionToken}` }),
    },
    withCredentials: true, 
  });

  authenticatedApi.interceptors.request.use(
    (config: any) => {
      console.log(`Auth API Request: ${config.method?.toUpperCase()} ${config.url}`);
      console.log('Auth header:', config.headers.Authorization ? 'Present' : 'Missing');
      console.log('Credentials enabled:', config.withCredentials);
      return config;
    },
    (error: any) => {
      console.error('Auth request error:', error.message);
      return Promise.reject(error);
    }
  );

  authenticatedApi.interceptors.response.use(
    (response: any) => {
      console.log(`Auth API Response: ${response.status} ${response.config.url}`);
      return response;
    },
    (error: any) => {
      console.error('Auth API Error:', {
        url: error.config?.url,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
        data: error.response?.data
      });
      
      if (error.response?.status === 401) {
        console.error('Authentication failed - token may be invalid or expired');
        // window.location.href = '/sign-in';
      }
      
      return Promise.reject(error);
    }
  );

  return authenticatedApi;
};

api.interceptors.request.use(
  async (config: any) => {
    try {
      const { useAuth } = await import('@clerk/nextjs');
      
    } catch (error) {
    }
    
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Credentials enabled:', config.withCredentials);
    return config;
  },
  (error: any) => {
    console.error('API request error:', error.message);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: any) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: any) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.response?.data?.message || error.message
    });
    
    if (error.response?.status === 401) {
      console.error('Authentication required - redirecting to sign in');
      // window.location.href = '/sign-in';
    }
    
    return Promise.reject(error);
  }
);

export default api;