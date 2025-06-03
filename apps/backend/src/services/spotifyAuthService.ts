// import axios from 'axios';

// interface SpotifyTokenResponse {
//   access_token: string;
//   token_type: string;
//   expires_in: number;
//   refresh_token?: string;
//   scope: string;
// }

// interface SpotifyUser {
//   id: string;
//   display_name: string;
//   email: string;
//   images: Array<{ url: string }>;
//   followers: { total: number };
//   country: string;
// }

// class SpotifyAuthService {
//   private clientId: string;
//   private clientSecret: string;
//   private redirectUri: string;
//   private scopes: string[];
  

//   private tokenStorage = new Map<string, {
//     accessToken: string;
//     refreshToken?: string;
//     expiresAt: number;
//     user: SpotifyUser;
//   }>();

//   constructor() {
//     this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
//     this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
//     this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/auth/spotify/callback';
//     this.scopes = [
//       'user-read-private',
//       'user-read-email',
//       'user-read-recently-played',
//       'user-top-read',
//       'playlist-read-private',
//       'playlist-read-collaborative',
//       'user-library-read'
//     ];
//   }

//   getAuthUrl(state?: string): string {
//     const params = new URLSearchParams({
//       response_type: 'code',
//       client_id: this.clientId,
//       scope: this.scopes.join(' '),
//       redirect_uri: this.redirectUri,
//       ...(state && { state })
//     });

//     return `https://accounts.spotify.com/authorize?${params.toString()}`;
//   }

//   async exchangeCodeForToken(code: string): Promise<{
//     accessToken: string;
//     refreshToken?: string;
//     expiresIn: number;
//     user: SpotifyUser;
//   }> {
//     try {
//       const tokenResponse = await axios.post<SpotifyTokenResponse>(
//         'https://accounts.spotify.com/api/token',
//         new URLSearchParams({
//           grant_type: 'authorization_code',
//           code,
//           redirect_uri: this.redirectUri,
//         }),
//         {
//           headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             Authorization: `Basic ${Buffer.from(
//               `${this.clientId}:${this.clientSecret}`
//             ).toString('base64')}`,
//           },
//         }
//       );

//       const { access_token, refresh_token, expires_in } = tokenResponse.data;

//       const userResponse = await axios.get<SpotifyUser>(
//         'https://api.spotify.com/v1/me',
//         {
//           headers: {
//             Authorization: `Bearer ${access_token}`,
//           },
//         }
//       );

//       const user = userResponse.data;
//       const expiresAt = Date.now() + (expires_in * 1000);

//       this.tokenStorage.set(user.id, {
//         accessToken: access_token,
//         refreshToken: refresh_token,
//         expiresAt,
//         user,
//       });

//       return {
//         accessToken: access_token,
//         refreshToken: refresh_token,
//         expiresIn: expires_in,
//         user,
//       };
//     } catch (error: any) {
//       console.error('Error exchanging code for token:', error.response?.data || error.message);
//       throw new Error('Failed to authenticate with Spotify');
//     }
//   }

//   async refreshAccessToken(userId: string): Promise<string | null> {
//     const stored = this.tokenStorage.get(userId);
//     if (!stored?.refreshToken) {
//       return null;
//     }

//     try {
//       const response = await axios.post<SpotifyTokenResponse>(
//         'https://accounts.spotify.com/api/token',
//         new URLSearchParams({
//           grant_type: 'refresh_token',
//           refresh_token: stored.refreshToken,
//         }),
//         {
//           headers: {
//             'Content-Type': 'application/x-www-form-urlencoded',
//             Authorization: `Basic ${Buffer.from(
//               `${this.clientId}:${this.clientSecret}`
//             ).toString('base64')}`,
//           },
//         }
//       );

//       const { access_token, expires_in, refresh_token } = response.data;
      
//       this.tokenStorage.set(userId, {
//         ...stored,
//         accessToken: access_token,
//         refreshToken: refresh_token || stored.refreshToken,
//         expiresAt: Date.now() + (expires_in * 1000),
//       });

//       return access_token;
//     } catch (error: any) {
//       console.error('Error refreshing token:', error.response?.data || error.message);
//       this.tokenStorage.delete(userId);
//       return null;
//     }
//   }

//   async getValidAccessToken(userId: string): Promise<string | null> {
//     const stored = this.tokenStorage.get(userId);
//     if (!stored) {
//       return null;
//     }

//     if (stored.expiresAt > Date.now() + (5 * 60 * 1000)) {
//       return stored.accessToken;
//     }

//     return await this.refreshAccessToken(userId);
//   }

//   getUserInfo(userId: string): SpotifyUser | null {
//     const stored = this.tokenStorage.get(userId);
//     return stored?.user || null;
//   }

//   isAuthenticated(userId: string): boolean {
//     const stored = this.tokenStorage.get(userId);
//     return stored !== undefined && stored.expiresAt > Date.now();
//   }

//   logout(userId: string): void {
//     this.tokenStorage.delete(userId);
//   }

//   getStoredUserIds(): string[] {
//     return Array.from(this.tokenStorage.keys());
//   }
// }

// export const spotifyAuthService = new SpotifyAuthService();
// export default spotifyAuthService;