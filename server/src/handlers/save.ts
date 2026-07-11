import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";

export const toggleSave = async (req: AuthReq, res: Response) => {
  const postId = Number(req.params.postId);
  const userId = req.user!.id;
  const existing = await prisma.save.findUnique({ where: { userId_postId: { userId, postId } } });
  if (existing) {
    await prisma.save.delete({ where: { id: existing.id } });
  } else {
    await prisma.save.create({ data: { userId, postId } });
  }
  res.json({ isSaved: !existing });
};
