import { Request, Response, NextFunction } from "express";

export const validateQuery = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (!req.query.mood) {
    res.status(400).json({ error: "Missing mood" });
    return;
  }
  next();
};

export default validateQuery;
