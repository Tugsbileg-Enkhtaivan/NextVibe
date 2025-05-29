import React, { useState, useEffect } from 'react';
import { User, Music, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

interface SpotifyUser {
  id: string;
  display_name: string;
  email: string;
  images: Array<{ url: string }>;
  followers: { total: number };
  country: string;
}

interface AuthResponse {
  user: SpotifyUser;
  isAuthenticated: boolean;
  hasValidToken: boolean;
}

const SpotifyAuth: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Check for auth callback and existing auth on component mount
  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      setError(null);

      // First check for auth callback
      const callbackResult = checkForAuthCallback();
      
      if (callbackResult.success) {
        // Auth callback successful, get user info
        await getCurrentUser();
        setSuccess('Successfully connected to Spotify!');
      } else if (callbackResult.error) {
        setError(`Authentication error: ${callbackResult.error}`);
      } else {
        // No callback, check if user is already authenticated
        const token = localStorage.getItem('spotify_user_token');
        if (token) {
          await getCurrentUser();
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setError('Failed to initialize authentication');
    } finally {
      setLoading(false);
    }
  };

  const checkForAuthCallback = (): { success: boolean; error?: string } => {
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    const token = urlParams.get('token');
    const error = urlParams.get('error');

    if (error) {
      return { success: false, error };
    }

    if (auth === 'success' && token) {
      // Store token
      localStorage.setItem('spotify_user_token', token);
      
      // Clean URL
      const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
      
      return { success: true };
    }

    return { success: false };
  };

  const getCurrentUser = async () => {
    try {
      const token = localStorage.getItem('spotify_user_token');
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }
  
      // FIXED: Use the correct API endpoint
      const response = await fetch('/api/auth/spotify/user/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
  
      if (response.ok) {
        const userData = await response.json();
        setUserInfo(userData);
        setIsAuthenticated(true);
        setError(null);
      } else if (response.status === 401) {
        localStorage.removeItem('spotify_user_token');
        setIsAuthenticated(false);
        setUserInfo(null);
        setError('Authentication expired. Please log in again.');
      } else {
        throw new Error(`Failed to get user information: ${response.status}`);
      }
    } catch (error) {
      console.error('Error getting user:', error);
      setError('Failed to get user information');
      setIsAuthenticated(false);
    }
  };

  const handleLogin = async () => {
    try {
      setAuthLoading(true);
      setError(null);
      setSuccess(null);
      
      // FIXED: Use the correct API endpoint
      const response = await fetch('/api/auth/spotify');
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('Auth API Error:', errorData);
        throw new Error(`Failed to get auth URL: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.authUrl) {
        // Redirect to Spotify auth
        window.location.href = data.authUrl;
      } else {
        throw new Error('No auth URL received');
      }
    } catch (error: any) {
      console.error('Error starting auth:', error);
      setError(`Failed to start authentication: ${error.message}`);
      setAuthLoading(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('spotify_user_token');
      
      if (!token) {
        setError('No token to refresh');
        return;
      }

      // FIXED: Use the correct API endpoint
      const response = await fetch('/api/auth/spotify/user/refresh-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        await getCurrentUser();
        setError(null);
        setSuccess('Token refreshed successfully!');
      } else {
        throw new Error('Failed to refresh token');
      }
    } catch (error: any) {
      console.error('Error refreshing token:', error);
      setError('Failed to refresh token. Please log in again.');
      await handleLogout();
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('spotify_user_token');
      
      if (token) {
        // FIXED: Use the correct API endpoint
        await fetch('/api/auth/spotify/user/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
      
      localStorage.removeItem('spotify_user_token');
      setIsAuthenticated(false);
      setUserInfo(null);
      setError(null);
      setSuccess('Successfully logged out');
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear local state even if API call fails
      localStorage.removeItem('spotify_user_token');
      setIsAuthenticated(false);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (error && !isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg border">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500 mb-4 flex items-center justify-center">
            <AlertCircle className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Authentication Error</h2>
          <p className="text-red-600 mb-4 text-sm">{error}</p>
          <button
            onClick={handleLogin}
            disabled={authLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {authLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <Music className="w-5 h-5 mr-2" />
                Try Again
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg border">
        <div className="text-center">
          <Music className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Connect with Spotify
          </h2>
          <p className="text-gray-600 mb-6">
            Connect your Spotify account to access your music data and get personalized recommendations based on your listening habits.
          </p>
          
          <button
            onClick={handleLogin}
            disabled={authLoading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:bg-green-300 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {authLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Connecting...
              </>
            ) : (
              <>
                <ExternalLink className="w-5 h-5 mr-2" />
                Connect with Spotify
              </>
            )}
          </button>
          
          <p className="text-xs text-gray-500 mt-4">
            You'll be redirected to Spotify to authorize the connection. We'll save your account data securely.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-lg border">
      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex items-center">
          <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* User Info */}
      <div className="flex items-center space-x-4 mb-4">
        {userInfo?.user.images?.[0]?.url ? (
          <img
            src={userInfo.user.images[0].url}
            alt={userInfo.user.display_name}
            className="w-16 h-16 rounded-full object-cover border-2 border-green-200"
          />
        ) : (
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-gray-400" />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            {userInfo?.user.display_name || 'Spotify User'}
          </h3>
          <p className="text-sm text-gray-600">
            {userInfo?.user.email}
          </p>
          <div className="flex items-center text-xs text-gray-500 mt-1">
            <span className={`w-2 h-2 rounded-full mr-2 ${userInfo?.hasValidToken ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            {userInfo?.hasValidToken ? 'Connected & Active' : 'Token Needs Refresh'}
          </div>
        </div>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 flex items-center">
          <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
          <p className="text-yellow-800 text-sm">{error}</p>
        </div>
      )}
      
      {/* User Stats */}
      {userInfo && (
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <h4 className="font-medium text-gray-900 mb-3">Account Details</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Status:</span>
              <span className="ml-1 font-medium text-green-600">
                {userInfo.isAuthenticated ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Country:</span>
              <span className="ml-1 font-medium">
                {userInfo.user.country || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Followers:</span>
              <span className="ml-1 font-medium">
                {userInfo.user.followers?.total?.toLocaleString() || '0'}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Token:</span>
              <span className="ml-1 font-medium">
                {userInfo.hasValidToken ? 'Valid' : 'Expired'}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      <div className="space-y-2">
        {!userInfo?.hasValidToken && (
          <button
            onClick={handleRefreshToken}
            disabled={loading}
            className="w-full bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Token
              </>
            )}
          </button>
        )}
        
        <button
          onClick={handleLogout}
          disabled={loading}
          className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Logging out...
            </>
          ) : (
            'Disconnect Spotify'
          )}
        </button>
      </div>
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Your Spotify data is securely stored in our database and used to provide personalized music recommendations.
      </p>
    </div>
  );
};

export default SpotifyAuth;