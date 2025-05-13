import { Request, Response } from "express";
import { addToSavedTracks } from "../services/spotifyService";

export const saveTrackToLibrary = async (req: Request, res: Response) => {
  try {
    const { songId, accessToken } = req.body;

    if (!songId || !accessToken) {
      res.status(400).json({ error: "Missing songId or accessToken" });
      return;
    }

    await addToSavedTracks(songId, accessToken);

    res.status(200).json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
};
