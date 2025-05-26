import dotenv from "dotenv";
import express, { Request, Response ,NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
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
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Credentials", "true");
  next();
});

app.options("/{*any}", (req, res) => {
  res.sendStatus(200);
});

app.use(clerkMiddleware());

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use("/api/ai-song", aiSongRouter);

app.get("/", requireClerkAuth, async (_req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

app.post("/users", async (req: Request, res: Response) => {
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

app.use("/{*any}", (req: Request, res: Response) => {
  res.status(404).json({ error: "Route not found" });
});


process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export {app , prisma};