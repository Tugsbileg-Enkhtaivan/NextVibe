import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import cookieParser from 'cookie-parser';
import aiSongRouter from "./routes/aiSongRouter";
import { requireClerkAuth } from "./middlewares/requireClerkAuth";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",").map((origin) =>
  origin.trim()
) || ["http://localhost:3000", "https://next-vibe-frontend.vercel.app"];

console.log("Allowed origins:", allowedOrigins);

app.use((req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin;
  console.log('Request origin:', origin);
  console.log('Request method:', req.method);
  console.log('Request URL:', req.url);
  
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    console.log('✅ Origin allowed:', origin);
  } else {
    console.log('⚠️ Origin not in allowed list:', origin);
  }
  
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cookie"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  
  if (req.method === 'OPTIONS') {
    console.log('Handling OPTIONS preflight request');
    res.sendStatus(200);
    return;
  }
  
  next();
});

app.use(cookieParser());

app.use(express.json());

app.use(clerkMiddleware({
  debug: process.env.NODE_ENV === 'development'
}));

// Routes
app.use("/api/ai-song", aiSongRouter);

app.get("/", requireClerkAuth, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ 
      message: "Protected route accessed successfully",
      userId: req.userId,
      users 
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/users", requireClerkAuth, async (req: Request, res: Response) => {
  const { username, email } = req.body;
  
  if (!username || !email) {
    res.status(400).json({ error: "Username and email are required" });
    return;
  }
  
  try {
    const user = await prisma.user.create({
      data: { username, email },
    });
    res.json({ message: "User created successfully", user });
  } catch (error) {
    console.error("Error creating user:", error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

app.post("/api/debug/auth", (req, res) => {
  console.log("=== Debug Auth Endpoint ===");
  console.log("Headers:", req.headers);
  console.log("Cookies:", req.cookies);
  console.log("Body:", req.body);
  
  res.json({ 
    headers: req.headers,
    cookies: req.cookies,
    hasAuth: !!req.headers.authorization,
    userId: req.userId || 'Not authenticated'
  });
});

app.use("{*any}", (req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found", path: req.originalUrl });
});

app.use((error: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Global error handler:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

const PORT = process.env.PORT || 8000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Clerk Secret Key: ${process.env.CLERK_SECRET_KEY ? 'Present' : 'Missing'}`);
  console.log(`Allowed Origins:`, allowedOrigins);
});

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
});

export { app, prisma };