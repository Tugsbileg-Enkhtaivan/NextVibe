// import { PrismaClient } from '@prisma/client';
// import axios from 'axios';
// import querystring from "querystring";

// const prisma = new PrismaClient();

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

// class EnhancedSpotifyAuthService {
//   private clientId: string;
//   private clientSecret: string;
//   private redirectUri: string;
//   private scopes: string[];

//   constructor() {
//     this.clientId = process.env.SPOTIFY_CLIENT_ID || '';
//     this.clientSecret = process.env.SPOTIFY_CLIENT_SECRET || '';
//     this.redirectUri = process.env.SPOTIFY_REDIRECT_URI || 'http://localhost:3000/callback';
//     this.scopes = [
//       'user-read-private',
//       'user-read-email',
//       'user-read-recently-played',
//       'user-top-read',
//       'playlist-read-private',
//       'playlist-read-collaborative',
//       'user-library-read',
//       'user-read-playback-position',
//       'user-read-playback-state'
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
//     user: SpotifyUser;
//     dbUser: any;
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

//       const spotifyUser = userResponse.data;
//       const expiresAt = new Date(Date.now() + (expires_in * 1000));

//       let dbUser = await prisma.user.findFirst({
//         where: {
//           spotifyAccount: {
//             spotifyId: spotifyUser.id
//           }
//         },
//         include: {
//           spotifyAccount: true,
//           profile: true
//         }
//       });

//       if (!dbUser) {
//         dbUser = await prisma.user.create({
//           data: {
//             email: spotifyUser.email,
//             username: spotifyUser.display_name || `spotify_${spotifyUser.id}`,
//             spotifyAccount: {
//               create: {
//                 spotifyId: spotifyUser.id,
//                 displayName: spotifyUser.display_name,
//                 email: spotifyUser.email,
//                 country: spotifyUser.country,
//                 accessToken: access_token,
//                 refreshToken: refresh_token || '',
//                 expiresAt: expiresAt,
//               }
//             },
//             profile: {
//               create: {
//                 avatar: spotifyUser.images?.[0]?.url || null,
//                 bio: `Spotify user with ${spotifyUser.followers.total} followers`
//               }
//             }
//           },
//           include: {
//             spotifyAccount: true,
//             profile: true
//           }
//         });
//       } else {
//         await prisma.spotifyAccount.update({
//           where: { userId: dbUser.id },
//           data: {
//             displayName: spotifyUser.display_name,
//             email: spotifyUser.email,
//             country: spotifyUser.country,
//             accessToken: access_token,
//             refreshToken: refresh_token || dbUser.spotifyAccount?.refreshToken || '',
//             expiresAt: expiresAt,
//           }
//         });

//         if (spotifyUser.images?.[0]?.url && dbUser.profile) {
//           await prisma.profile.update({
//             where: { userId: dbUser.id },
//             data: {
//               avatar: spotifyUser.images[0].url
//             }
//           });
//         }
//       }

//       return { user: spotifyUser, dbUser };
//     } catch (error: any) {
//       console.error('Error exchanging code for token:', error.response?.data || error.message);
//       throw new Error('Failed to authenticate with Spotify');
//     }
//   }

//   async refreshAccessToken(userId: string): Promise<string | null> {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         include: { spotifyAccount: true }
//       });

//       if (!user?.spotifyAccount?.refreshToken) {
//         return null;
//       }

//       const response = await axios.post<SpotifyTokenResponse>(
//         'https://accounts.spotify.com/api/token',
//         new URLSearchParams({
//           grant_type: 'refresh_token',
//           refresh_token: user.spotifyAccount.refreshToken,
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
//       const expiresAt = new Date(Date.now() + (expires_in * 1000));

//       await prisma.spotifyAccount.update({
//         where: { userId },
//         data: {
//           accessToken: access_token,
//           refreshToken: refresh_token || user.spotifyAccount.refreshToken,
//           expiresAt: expiresAt,
//         }
//       });

//       return access_token;
//     } catch (error: any) {
//       console.error('Error refreshing token:', error.response?.data || error.message);
//       return null;
//     }
//   }

//   async getValidAccessToken(userId: string): Promise<string | null> {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         include: { spotifyAccount: true }
//       });

//       if (!user?.spotifyAccount) {
//         return null;
//       }

//       const { accessToken, expiresAt } = user.spotifyAccount;

//       if (expiresAt && expiresAt.getTime() > Date.now() + (5 * 60 * 1000)) {
//         return accessToken;
//       }

//       return await this.refreshAccessToken(userId);
//     } catch (error) {
//       console.error('Error getting valid access token:', error);
//       return null;
//     }
//   }

//   async getUserFromDatabase(userId: string) {
//     return await prisma.user.findUnique({
//       where: { id: userId },
//       include: {
//         spotifyAccount: true,
//         profile: true
//       }
//     });
//   }

//   async isAuthenticated(userId: string): Promise<boolean> {
//     try {
//       const user = await prisma.user.findUnique({
//         where: { id: userId },
//         include: { spotifyAccount: true }
//       });

//       if (!user?.spotifyAccount) {
//         return false;
//       }

//       // Check if we have a valid token or can refresh it
//       const validToken = await this.getValidAccessToken(userId);
//       return validToken !== null;
//     } catch (error) {
//       console.error('Error checking authentication:', error);
//       return false;
//     }
//   }

//   async logout(userId: string): Promise<void> {
//     try {
//       await prisma.spotifyAccount.delete({
//         where: { userId }
//       });
//     } catch (error) {
//       console.error('Error during logout:', error);
//     }
//   }

//   async getAllAuthenticatedUsers() {
//     return await prisma.user.findMany({
//       where: {
//         spotifyAccount: {
//           isNot: null
//         }
//       },
//       include: {
//         spotifyAccount: true,
//         profile: true
//       }
//     });
//   }
// }

// export const enhancedSpotifyAuthService = new EnhancedSpotifyAuthService();
// export default enhancedSpotifyAuthService;