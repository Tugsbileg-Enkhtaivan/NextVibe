import dotenv from "dotenv";
import express, { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import aiSongRouter from "./routes/aiSongRouter";
// import spotifyRouter from "./routes/spotifyRouter";
import { verifyToken } from "@clerk/backend";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

const allowedOrigins = [
  "http://localhost:3000",
  "https://next-vibe-frontend.vercel.app/",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json());

app.use("/api", aiSongRouter);
// app.use("/api/spotify", spotifyRouter);

const isAuthenticated = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { authorization } = req.headers;

  const token = authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorzied" });
    return;
  }
  try {
    const verifyiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    });
    console.log(verifyiedToken, "verifyiedToken");
    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorzied" });
  }
};

app.get("/", isAuthenticated, async (_req: Request, res: Response) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post("/users", async (req: Request, res: Response) => {
  const { username, email } = req.body;
  try {
    const user = await prisma.user.create({
      data: { username, email },
    });
    res.json({ message: "User created successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to create user" });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
