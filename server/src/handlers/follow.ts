import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";

export const toggleFollow = async (req: AuthReq, res: Response) => {
  const receiverId = Number(req.params.userId);
  const giverId = req.user!.id;
  if (receiverId === giverId) {
    res.status(400).json({ message: "Cannot follow yourself" });
    return;
  }
  const existing = await prisma.follow.findUnique({
    where: { giverId_receiverId: { giverId, receiverId } },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { giverId, receiverId } });
  }
  const followers = await prisma.follow.count({ where: { receiverId } });
  res.json({ isFollowing: !existing, followers });
};

export const searchSubscribers = async (req: AuthReq, res: Response) => {
  const users = await prisma.user.findMany({
    where: { id: { not: req.user!.id } },
    select: { id: true, username: true, location: true },
    take: 3,
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
};
