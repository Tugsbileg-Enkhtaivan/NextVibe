// utils/clientAuthService.ts
import axios from 'axios';

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
  followers: { total: number };
  country: string;
}

interface UserInfo {
  user: SpotifyUser;
  isAuthenticated: boolean;
  hasValidToken: boolean;
}

class ClientAuthService {
  private userToken: string | null = null;
  private userInfo: UserInfo | null = null;

  constructor() {
    // Load token from localStorage on initialization
    if (typeof window !== 'undefined') {
      this.userToken = localStorage.getItem('spotify_user_token');
    }
  }

  // Start Spotify authentication
  async startAuth(): Promise<string> {
    try {
      const response = await axios.get('/api/auth/spotify');
      return response.data.authUrl;
    } catch (error: any) {
      console.error('Error starting auth:', error);
      throw new Error('Failed to start authentication');
    }
  }

  // Handle auth callback (call this when user returns from Spotify)
  handleAuthCallback(): { success: boolean; error?: string } {
    if (typeof window === 'undefined') return { success: false };

    const urlParams = new URLSearchParams(window.location.search);
    const authStatus = urlParams.get('auth');
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      return { success: false, error };
    }

    if (authStatus === 'success' && token) {
      this.userToken = token;
      localStorage.setItem('spotify_user_token', token);
      
      // Clean up URL
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      return { success: true };
    }

    return { success: false };
  }

  // Get current user info
  async getCurrentUser(): Promise<UserInfo | null> {
    if (!this.userToken) return null;

    try {
      const response = await axios.get('/api/user/me', {
        headers: {
          Authorization: `Bearer ${this.userToken}`
        }
      });

      this.userInfo = response.data;
      return this.userInfo;
    } catch (error: any) {
      console.error('Error getting current user:', error);
      
      // If unauthorized, clear stored token
      if (error.response?.status === 401) {
        this.logout();
      }
      
      return null;
    }
  }

  // Refresh token
  async refreshToken(): Promise<boolean> {
    if (!this.userToken) return false;

    try {
      await axios.post('/api/user/refresh-token', {}, {
        headers: {
          Authorization: `Bearer ${this.userToken}`
        }
      });

      return true;
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      
      // If refresh fails, user needs to re-authenticate
      this.logout();
      return false;
    }
  }

  // Logout
  async logout(): Promise<void> {
    try {
      if (this.userToken) {
        await axios.post('/api/user/logout', {}, {
          headers: {
            Authorization: `Bearer ${this.userToken}`
          }
        });
      }
    } catch (error) {
      console.warn('Error during logout:', error);
    }

    // Clear local state
    this.userToken = null;
    this.userInfo = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_user_token');
    }
  }

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return this.userToken !== null;
  }

  // Get stored user info (without API call)
  getCachedUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  // Get user token for API calls
  getUserToken(): string | null {
    return this.userToken;
  }
}

export const clientAuthService = new ClientAuthService();
export default clientAuthService;