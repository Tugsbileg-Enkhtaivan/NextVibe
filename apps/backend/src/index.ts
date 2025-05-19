import dotenv from "dotenv";
import express from "express";
import { PrismaClient } from "@prisma/client";
import cors from "cors";
import aiSongRouter from "./routes/aiSongRouter";
import spotifyRouter from "./routes/spotifyRouter";
import { verifyToken } from "@clerk/backend";
import { error } from "console";

dotenv.config();

const app = express();
const prisma = new PrismaClient();

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

app.use("/api/ai-song-search", aiSongRouter);
app.use("/api/spotify", spotifyRouter);


app.get("/", async (req, res) => {
  const { authorization } = req.headers;
  const token = authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Unauthorzied" })
    return;
  }
  try {
    const verifyiedToken = await verifyToken(token, {
      secretKey: process.env.CLERK_SECRET_KEY,
    })
  } catch (error) {
    res.status(401).json({ error: "Unauthorzied" })
  }

  const users = await prisma.user.findMany();
  res.json(users);
});

app.post("/users", async (req, res) => {
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
