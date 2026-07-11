import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";
import { comparePasswords, createJwt, hashPassword } from "../modules/auth.js";

const userSelect = {
  id: true,
  username: true,
  name: true,
  location: true,
  bio: true,
  email: true,
};

export const createNewUser = async (req: AuthReq, res: Response) => {
  const { email, username, password, name } = req.body;
  try {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { username }] },
    });
    if (existing) {
      res.status(409).json({ message: "Email or username already taken" });
      return;
    }
    const hashed = await hashPassword(password);
    const user = await prisma.user.create({
      data: { email, username, password: hashed, name },
    });
    const token = createJwt({ id: user.id, username: user.username });
    res.status(201).json({ token, user: { id: user.id, username: user.username, name: user.name } });
  } catch (e) {
    res.status(500).json({ message: "Could not create user" });
  }
};

export const signIn = async (req: AuthReq, res: Response) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const valid = await comparePasswords(password, user.password);
    if (!valid) {
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }
    const token = createJwt({ id: user.id, username: user.username });
    res.status(200).json({ token, user: { id: user.id, username: user.username, name: user.name } });
  } catch (e) {
    res.status(500).json({ message: "Could not sign in" });
  }
};

export const getMe = async (req: AuthReq, res: Response) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: userSelect,
  });
  if (!user) {
    res.status(404).json({ message: "Not found" });
    return;
  }
  const [followers, following] = await Promise.all([
    prisma.follow.count({ where: { receiverId: user.id } }),
    prisma.follow.count({ where: { giverId: user.id } }),
  ]);
  res.json({ ...user, followers, following });
};

export const updateMe = async (req: AuthReq, res: Response) => {
  const { name, location, bio } = req.body;
  try {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name, location, bio },
      select: userSelect,
    });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: "Could not update profile" });
  }
};

export const getUserByUsername = async (req: AuthReq, res: Response) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({
    where: { username },
    select: userSelect,
  });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const [followers, following, isFollowing] = await Promise.all([
    prisma.follow.count({ where: { receiverId: user.id } }),
    prisma.follow.count({ where: { giverId: user.id } }),
    prisma.follow.findUnique({
      where: { giverId_receiverId: { giverId: req.user!.id, receiverId: user.id } },
    }),
  ]);
  res.json({ ...user, followers, following, isFollowing: Boolean(isFollowing) });
};

export const searchUsers = async (req: AuthReq, res: Response) => {
  const q = String(req.query.q ?? "").trim();
  if (!q) {
    res.json([]);
    return;
  }
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ],
    },
    select: userSelect,
    take: 20,
  });
  res.json(users);
};
