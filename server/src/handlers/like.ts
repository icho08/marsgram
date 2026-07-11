import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";

export const toggleLike = async (req: AuthReq, res: Response) => {
  const postId = Number(req.params.postId);
  const userId = req.user!.id;
  const existing = await prisma.like.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) {
    await prisma.like.delete({ where: { id: existing.id } });
  } else {
    await prisma.like.create({ data: { userId, postId } });
  }
  const likeCount = await prisma.like.count({ where: { postId } });
  res.json({ isLiked: !existing, likeCount });
};
