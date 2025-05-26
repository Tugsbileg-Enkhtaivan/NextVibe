import dotenv from "dotenv";
import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import aiSongRouter from "./routes/aiSongRouter";
import { requireClerkAuth } from "./middlewares/requireClerkAuth";
import { clerkMiddleware } from "@clerk/express";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(clerkMiddleware());

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use("/api/ai-song", aiSongRouter);
// app.use("/api/spotify", spotifyRouter);

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

const originalUse = app.use;
app.use = function (path: any, ...args: any[]) {
  console.log("app.use called with path:", path);
  return originalUse.call(this, path, ...args);
};

process.on('SIGINT', async () => {
  console.log('Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

export {app , prisma};