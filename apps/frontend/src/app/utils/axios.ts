import axios from 'axios';

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string; height: number; width: number }>;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

interface TokenData {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

interface AuthInitiateResponse {
  url: string;
}

interface TokenRefreshResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface PlaylistsResponse {
  items: any[];
}

interface TopTracksResponse {
  items: any[]; 
}

interface TopArtistsResponse {
  items: any[]; 
}

class TokenManager {
  private static readonly TOKEN_KEY = 'spotify_tokens';
  private static readonly USER_KEY = 'spotify_user';

  static isClient(): boolean {
    return typeof window !== 'undefined';
  }

  static getTokens(): TokenData | null {
    if (!this.isClient()) return null;
    
    try {
      const stored = localStorage.getItem(this.TOKEN_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('Error parsing stored tokens:', error);
      this.clearTokens();
      return null;
    }
  }

  static setTokens(tokens: TokenData): void {
    if (!this.isClient()) return;
    
    try {
      localStorage.setItem(this.TOKEN_KEY, JSON.stringify(tokens));
    } catch (error) {
      console.error('Error storing tokens:', error);
    }
  }

  static clearTokens(): void {
    if (!this.isClient()) return;
    
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  static isTokenExpired(tokens: TokenData): boolean {
    return Date.now() >= tokens.expires_at;
  }

  static getValidToken(): string | null {
    const tokens = this.getTokens();
    if (!tokens) return null;
    
    if (this.isTokenExpired(tokens)) {
      return null;
    }
    
    return tokens.access_token;
  }
}

export const api = axios.create({
  baseURL: process.env.BASE_URL,
  withCredentials: true,
  timeout: 30000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: any) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.request.use(
  (config: any) => {
    if (TokenManager.isClient()) {
      const token = TokenManager.getValidToken();
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    
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
  async (error: any) => {
    const originalRequest = error.config;
    
    console.error('❌ API Error:', {
      url: originalRequest?.url,
      method: originalRequest?.method,
      status: error.response?.status,
      message: error.message
    });

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }).catch((err) => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const tokens = TokenManager.getTokens();
        if (!tokens?.refresh_token) {
          throw new Error('No refresh token available');
        }

        const response = await api.post<TokenRefreshResponse>('/auth/refresh', {
          refresh_token: tokens.refresh_token
        });

        const newTokens: TokenData = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token || tokens.refresh_token,
          expires_at: Date.now() + (response.data.expires_in * 1000)
        };

        TokenManager.setTokens(newTokens);
        processQueue(null, newTokens.access_token);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newTokens.access_token}`;
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        TokenManager.clearTokens();
        
        if (TokenManager.isClient()) {
          window.location.href = '/login';
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const spotifyApi = {
  auth: {
    initiate: async (): Promise<{ url: string }> => {
      try {
        const response = await api.get<AuthInitiateResponse>('/auth/spotify');
        return response.data;
      } catch (error) {
        console.error('Failed to initiate auth:', error);
        throw new Error('Authentication initialization failed');
      }
    },

    getCurrentUser: async (): Promise<SpotifyUser> => {
      try {
        const response = await api.get<SpotifyUser>('/user/me');
        return response.data;
      } catch (error) {
        console.error('Failed to get current user:', error);
        throw new Error('Failed to retrieve user information');
      }
    },

    logout: async (): Promise<void> => {
      try {
        await api.post('/user/logout');
        TokenManager.clearTokens();
      } catch (error) {
        console.error('Logout error:', error);
        TokenManager.clearTokens();
      }
    },

    refreshToken: async (): Promise<TokenData> => {
      try {
        const tokens = TokenManager.getTokens();
        if (!tokens?.refresh_token) {
          throw new Error('No refresh token available');
        }

        const response = await api.post<TokenRefreshResponse>('/auth/refresh', {
          refresh_token: tokens.refresh_token
        });

        const newTokens: TokenData = {
          access_token: response.data.access_token,
          refresh_token: response.data.refresh_token || tokens.refresh_token,
          expires_at: Date.now() + (response.data.expires_in * 1000)
        };

        TokenManager.setTokens(newTokens);
        return newTokens;
      } catch (error) {
        console.error('Token refresh failed:', error);
        TokenManager.clearTokens();
        throw error;
      }
    },
  },
  
  user: {
    getProfile: async (userId?: string): Promise<SpotifyUser> => {
      try {
        const response = await api.get<SpotifyUser>(`/user/profile${userId ? `/${userId}` : ''}`);
        return response.data;
      } catch (error) {
        console.error('Failed to get user profile:', error);
        throw new Error('Failed to retrieve user profile');
      }
    },

    getPlaylists: async (): Promise<any[]> => {
      try {
        const response = await api.get<PlaylistsResponse>('/user/playlists');
        return response.data.items;
      } catch (error) {
        console.error('Failed to get playlists:', error);
        throw new Error('Failed to retrieve playlists');
      }
    },

    getTopTracks: async (
      timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
    ): Promise<any[]> => {
      try {
        const response = await api.get<TopTracksResponse>(`/user/top/tracks?time_range=${timeRange}`);
        return response.data.items;
      } catch (error) {
        console.error('Failed to get top tracks:', error);
        throw new Error('Failed to retrieve top tracks');
      }
    },

    getTopArtists: async (
      timeRange: 'short_term' | 'medium_term' | 'long_term' = 'medium_term'
    ): Promise<any[]> => {
      try {
        const response = await api.get<TopArtistsResponse>(`/user/top/artists?time_range=${timeRange}`);
        return response.data.items;
      } catch (error) {
        console.error('Failed to get top artists:', error);
        throw new Error('Failed to retrieve top artists');
      }
    },
  }
};

export const isAuthenticated = (): boolean => {
  return TokenManager.getValidToken() !== null;
};

export const clearAuthData = (): void => {
  TokenManager.clearTokens();
};

export { TokenManager };
export default api;