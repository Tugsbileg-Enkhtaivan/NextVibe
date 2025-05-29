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
    if (typeof window !== 'undefined') {
      this.userToken = localStorage.getItem('spotify_user_token');
    }
  }

  async startAuth(): Promise<string> {
    try {
      const response = await axios.get('/api/auth/spotify');
      return response.data.authUrl;
    } catch (error: any) {
      console.error('Error starting auth:', error);
      throw new Error('Failed to start authentication');
    }
  }

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
      
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      return { success: true };
    }

    return { success: false };
  }

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
      
      if (error.response?.status === 401) {
        this.logout();
      }
      
      return null;
    }
  }

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
      
      this.logout();
      return false;
    }
  }

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

    this.userToken = null;
    this.userInfo = null;
    
    if (typeof window !== 'undefined') {
      localStorage.removeItem('spotify_user_token');
    }
  }

  isAuthenticated(): boolean {
    return this.userToken !== null;
  }

  getCachedUserInfo(): UserInfo | null {
    return this.userInfo;
  }

  getUserToken(): string | null {
    return this.userToken;
  }
}

export const clientAuthService = new ClientAuthService();
export default clientAuthService;