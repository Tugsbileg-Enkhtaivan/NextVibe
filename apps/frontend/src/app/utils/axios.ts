import axios from 'axios';

export const api = axios.create({
  baseURL: process.env.BASE_URL,
  withCredentials: true,
  timeout: 40000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config: any) => {
    if (typeof window !== 'undefined' && window.Clerk?.session?.getToken) {
      try {
        const token = await window.Clerk.session.getToken();
        if (token) {
          config.headers = config.headers || {};
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Failed to get auth token:', error);
      }
    }
    return config;
  },
  (error: any) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.request.use(
  (config: any) => {
    console.log(`🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      params: config.params,
      hasAuth: !!config.headers?.Authorization
    });
    return config;
  },
  (error: any) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response: any) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error: any) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.message,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export default api;