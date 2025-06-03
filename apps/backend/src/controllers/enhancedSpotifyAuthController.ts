// import { Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import { PrismaClient } from '@prisma/client';
// import { enhancedSpotifyAuthService } from '../services/enhancedSpotifyAuthService';

// const prisma = new PrismaClient();

// const sessionStorage = new Map<string, {
//   state: string;
//   userId?: string;
//   timestamp: number;
// }>();

// setInterval(() => {
//   const oneHourAgo = Date.now() - (60 * 60 * 1000);
//   for (const [sessionId, session] of sessionStorage.entries()) {
//     if (session.timestamp < oneHourAgo) {
//       sessionStorage.delete(sessionId);
//     }
//   }
// }, 60 * 60 * 1000);

// export const initiateSpotifyAuth = async (req: Request, res: Response): Promise<void> => {
//   try {
//     console.log('🎵 Initiating Spotify auth...');
//     console.log('Environment check:', {
//       clientId: process.env.SPOTIFY_CLIENT_ID ? '✅ Set' : '❌ Missing',
//       clientSecret: process.env.SPOTIFY_CLIENT_SECRET ? '✅ Set' : '❌ Missing',
//       redirectUri: process.env.SPOTIFY_REDIRECT_URI || 'Using default'
//     });

//     const sessionId = uuidv4();
//     const state = uuidv4();
    
//     console.log('Generated session:', { sessionId, state });
    
//     sessionStorage.set(sessionId, {
//       state,
//       timestamp: Date.now(),
//     });

//     res.cookie('spotify_session', sessionId, {
//       httpOnly: true,
//       secure: process.env.NODE_ENV === 'production',
//       sameSite: 'strict',
//       maxAge: 60 * 60 * 1000, // 1 hour
//     });

//     const authUrl = enhancedSpotifyAuthService.getAuthUrl(state);
//     console.log('Generated auth URL:', authUrl);

//     res.json({
//       authUrl,
//       message: 'Redirect user to this URL to authenticate with Spotify',
//       sessionId,
//       debug: {
//         hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
//         redirectUri: process.env.SPOTIFY_REDIRECT_URI
//       }
//     });
//   } catch (error: any) {
//     console.error('❌ Error initiating Spotify auth:', error);
//     console.error('Stack trace:', error.stack);
//     res.status(500).json({ 
//       error: 'Failed to initiate Spotify authentication',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined,
//       debug: {
//         hasClientId: !!process.env.SPOTIFY_CLIENT_ID,
//         hasClientSecret: !!process.env.SPOTIFY_CLIENT_SECRET,
//         redirectUri: process.env.SPOTIFY_REDIRECT_URI
//       }
//     });
//   }
// };

// export const handleSpotifyCallback = async (req: Request, res: Response): Promise<void> => {
//   const { code, state, error } = req.query as {
//     code?: string;
//     state?: string;
//     error?: string;
//   };

//   try {
//     if (error) {
//       console.error('Spotify authorization error:', error);
//       const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//       redirectUrl.searchParams.set('error', 'access_denied');
//       redirectUrl.searchParams.set('message', 'User denied access to Spotify');
//       res.redirect(redirectUrl.toString());
//       return;
//     }

//     if (!code || !state) {
//       const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//       redirectUrl.searchParams.set('error', 'missing_parameters');
//       redirectUrl.searchParams.set('message', 'Missing authorization code or state');
//       res.redirect(redirectUrl.toString());
//       return;
//     }

//     const sessionId = req.cookies?.spotify_session;
//     if (!sessionId) {
//       const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//       redirectUrl.searchParams.set('error', 'missing_session');
//       redirectUrl.searchParams.set('message', 'Missing session cookie');
//       res.redirect(redirectUrl.toString());
//       return;
//     }

//     const session = sessionStorage.get(sessionId);
//     if (!session || session.state !== state) {
//       const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//       redirectUrl.searchParams.set('error', 'invalid_session');
//       redirectUrl.searchParams.set('message', 'Invalid session or state mismatch');
//       res.redirect(redirectUrl.toString());
//       return;
//     }

//     const { user, dbUser } = await enhancedSpotifyAuthService.exchangeCodeForToken(code);

//     sessionStorage.set(sessionId, {
//       ...session,
//       userId: dbUser.id, 
//     });

//     const userToken = Buffer.from(JSON.stringify({
//       userId: dbUser.id,
//       sessionId,
//       timestamp: Date.now(),
//       spotifyId: user.id 
//     })).toString('base64');

//     const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//     redirectUrl.searchParams.set('auth', 'success');
//     redirectUrl.searchParams.set('token', userToken);
//     redirectUrl.searchParams.set('user', user.display_name || user.id);
    
//     res.redirect(redirectUrl.toString());
//   } catch (error: any) {
//     console.error('Error handling Spotify callback:', error);
//     const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//     redirectUrl.searchParams.set('error', 'auth_failed');
//     redirectUrl.searchParams.set('message', 'Failed to complete authentication');
//     res.redirect(redirectUrl.toString());
//   }
// };

// export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       res.status(401).json({ error: 'User not authenticated' });
//       return;
//     }

//     const dbUser = await enhancedSpotifyAuthService.getUserFromDatabase(userId);
//     if (!dbUser?.spotifyAccount) {
//       res.status(404).json({ 
//         error: 'User not found',
//         message: 'No Spotify account linked to this user'
//       });
//       return;
//     }

//     const spotifyAccount = dbUser.spotifyAccount;
//     const isAuthenticated = await enhancedSpotifyAuthService.isAuthenticated(userId);
//     const hasValidToken = await enhancedSpotifyAuthService.getValidAccessToken(userId) !== null;
    
//     await prisma.spotifyAccount.update({
//       where: { userId },
//       data: { updatedAt: new Date() }
//     });

//     res.json({
//       user: {
//         id: spotifyAccount.spotifyId,
//         display_name: spotifyAccount.displayName,
//         email: spotifyAccount.email,
//         images: dbUser.profile?.avatar ? [{ url: dbUser.profile.avatar }] : [],
//         followers: { total: 0 },
//         country: spotifyAccount.country
//       },
//       isAuthenticated,
//       hasValidToken,
//       database: {
//         userId: dbUser.id,
//         username: dbUser.username,
//         createdAt: dbUser.createdAt,
//         updatedAt: dbUser.updatedAt
//       }
//     });
//   } catch (error: any) {
//     console.error('Error getting current user:', error);
//     res.status(500).json({ 
//       error: 'Failed to get user information',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// export const logoutUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const sessionId = req.cookies?.spotify_session;

//     if (userId) {
//       await enhancedSpotifyAuthService.logout(userId);
      
//       // Log the logout event (optional)
//       console.log(`User ${userId} logged out at ${new Date().toISOString()}`);
//     }

//     if (sessionId) {
//       sessionStorage.delete(sessionId);
//     }

//     res.clearCookie('spotify_session');

//     res.json({ 
//       message: 'Successfully logged out',
//       timestamp: new Date().toISOString()
//     });
//   } catch (error: any) {
//     console.error('Error logging out user:', error);
//     res.status(500).json({ 
//       error: 'Failed to logout',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// export const refreshUserToken = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       res.status(401).json({ error: 'User not authenticated' });
//       return;
//     }

//     const newToken = await enhancedSpotifyAuthService.refreshAccessToken(userId);
//     if (!newToken) {
//       res.status(401).json({ 
//         error: 'Failed to refresh token. Please re-authenticate.',
//         action: 'reauth_required'
//       });
//       return;
//     }

//     await prisma.spotifyAccount.update({
//       where: { userId },
//       data: { updatedAt: new Date() }
//     });

//     res.json({ 
//       message: 'Token refreshed successfully',
//       hasValidToken: true,
//       timestamp: new Date().toISOString()
//     });
//   } catch (error: any) {
//     console.error('Error refreshing token:', error);
//     res.status(500).json({ 
//       error: 'Failed to refresh token',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };

// export const authenticateSpotifyUser = async (req: Request, res: Response, next: any): Promise<void> => {
//   try {
//     const authHeader = req.headers.authorization;
//     const sessionId = req.cookies?.spotify_session;

//     let userId: string | null = null;

//     if (authHeader?.startsWith('Bearer ')) {
//       try {
//         const token = authHeader.substring(7);
//         const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
//         userId = decoded.userId;
        
//         const tokenAge = Date.now() - decoded.timestamp;
//         if (tokenAge > 24 * 60 * 60 * 1000) {
//           res.status(401).json({ 
//             error: 'Token expired. Please re-authenticate.',
//             action: 'reauth_required'
//           });
//           return;
//         }
//       } catch (e) {
//         console.warn('Invalid bearer token format:', e);
//       }
//     }

//     if (!userId && sessionId) {
//       const session = sessionStorage.get(sessionId);
//       userId = session?.userId || null;

//       if (session && Date.now() - session.timestamp > 60 * 60 * 1000) {
//         sessionStorage.delete(sessionId);
//         userId = null;
//       }
//     }

//     if (!userId) {
//       res.status(401).json({ 
//         error: 'Authentication required',
//         action: 'login_required'
//       });
//       return;
//     }

//     const isAuthenticated = await enhancedSpotifyAuthService.isAuthenticated(userId);
//     if (!isAuthenticated) {
//       res.status(401).json({ 
//         error: 'Spotify authentication expired. Please re-authenticate.',
//         action: 'reauth_required'
//       });
//       return;
//     }

//     req.user = { id: userId };
//     next();
//   } catch (error: any) {
//     console.error('Error authenticating user:', error);
//     res.status(500).json({ 
//       error: 'Authentication error',
//       details: process.env.NODE_ENV === 'development' ? error.message : undefined
//     });
//   }
// };