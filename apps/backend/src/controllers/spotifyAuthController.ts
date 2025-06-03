// import { Request, Response } from 'express';
// import { v4 as uuidv4 } from 'uuid';
// import spotifyAuthService from '../services/spotifyAuthService';

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
// }, 60 * 60 * 1000); // Run every hour

// export const initiateSpotifyAuth = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const sessionId = uuidv4();
//     const state = uuidv4();
    
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

//     const authUrl = spotifyAuthService.getAuthUrl(state);

//     res.json({
//       authUrl,
//       message: 'Redirect user to this URL to authenticate with Spotify'
//     });
//   } catch (error: any) {
//     console.error('Error initiating Spotify auth:', error);
//     res.status(500).json({ error: 'Failed to initiate Spotify authentication' });
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
//       res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}?error=access_denied`);
//       return;
//     }

//     if (!code || !state) {
//       res.status(400).json({ error: 'Missing authorization code or state' });
//       return;
//     }

//     const sessionId = req.cookies?.spotify_session;
//     if (!sessionId) {
//       res.status(400).json({ error: 'Missing session cookie' });
//       return;
//     }

//     const session = sessionStorage.get(sessionId);
//     if (!session || session.state !== state) {
//       res.status(400).json({ error: 'Invalid session or state mismatch' });
//       return;
//     }

//     const tokenData = await spotifyAuthService.exchangeCodeForToken(code);

//     sessionStorage.set(sessionId, {
//       ...session,
//       userId: tokenData.user.id,
//     });

//     const userToken = Buffer.from(JSON.stringify({
//       userId: tokenData.user.id,
//       sessionId,
//       timestamp: Date.now()
//     })).toString('base64');

//     const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//     redirectUrl.searchParams.set('auth', 'success');
//     redirectUrl.searchParams.set('token', userToken);
    
//     res.redirect(redirectUrl.toString());
//   } catch (error: any) {
//     console.error('Error handling Spotify callback:', error);
//     const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
//     redirectUrl.searchParams.set('error', 'auth_failed');
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

//     const userInfo = spotifyAuthService.getUserInfo(userId);
//     if (!userInfo) {
//       res.status(404).json({ error: 'User not found' });
//       return;
//     }

//     const isAuthenticated = spotifyAuthService.isAuthenticated(userId);
    
//     res.json({
//       user: userInfo,
//       isAuthenticated,
//       hasValidToken: await spotifyAuthService.getValidAccessToken(userId) !== null
//     });
//   } catch (error: any) {
//     console.error('Error getting current user:', error);
//     res.status(500).json({ error: 'Failed to get user information' });
//   }
// };

// export const logoutUser = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     const sessionId = req.cookies?.spotify_session;

//     if (userId) {
//       spotifyAuthService.logout(userId);
//     }

//     if (sessionId) {
//       sessionStorage.delete(sessionId);
//     }

//     res.clearCookie('spotify_session');

//     res.json({ message: 'Successfully logged out' });
//   } catch (error: any) {
//     console.error('Error logging out user:', error);
//     res.status(500).json({ error: 'Failed to logout' });
//   }
// };

// export const refreshUserToken = async (req: Request, res: Response): Promise<void> => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       res.status(401).json({ error: 'User not authenticated' });
//       return;
//     }

//     const newToken = await spotifyAuthService.refreshAccessToken(userId);
//     if (!newToken) {
//       res.status(401).json({ error: 'Failed to refresh token. Please re-authenticate.' });
//       return;
//     }

//     res.json({ 
//       message: 'Token refreshed successfully',
//       hasValidToken: true
//     });
//   } catch (error: any) {
//     console.error('Error refreshing token:', error);
//     res.status(500).json({ error: 'Failed to refresh token' });
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
//       } catch (e) {
//       }
//     }

//     if (!userId && sessionId) {
//       const session = sessionStorage.get(sessionId);
//       userId = session?.userId || null;
//     }

//     if (!userId) {
//       res.status(401).json({ error: 'Authentication required' });
//       return;
//     }

//     const isAuthenticated = spotifyAuthService.isAuthenticated(userId);
//     if (!isAuthenticated) {
//       res.status(401).json({ error: 'Spotify authentication expired. Please re-authenticate.' });
//       return;
//     }

//     req.user = { id: userId };
//     next();
//   } catch (error: any) {
//     console.error('Error authenticating user:', error);
//     res.status(500).json({ error: 'Authentication error' });
//   }
// };