import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import { NextFunction, Response } from "express";
import { AuthReq, JwtUser } from "../types.js";

const JWT_SECRET = process.env.JWT_SECRET ?? "";

export const createJwt = (user: JwtUser): string => {
  return jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
};

export const protect = (req: AuthReq, res: Response, next: NextFunction): void => {
  const bearer = req.headers.authorization;
  if (!bearer) {
    res.status(401).json({ message: "Not authorized" });
    return;
  }

  const [, token] = bearer.split(" ");
  if (!token) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as JwtUser;
    req.user = user;
    next();
  } catch (e) {
    res.status(401).json({ message: "Token unverifiable" });
  }
};

export const hashPassword = (password: string): Promise<string> => bcrypt.hash(password, 10);

export const comparePasswords = (password: string, hash: string): Promise<boolean> =>
  bcrypt.compare(password, hash);
