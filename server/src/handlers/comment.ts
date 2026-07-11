import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";

const COMMENT_PAGE_SIZE = 20;
const MAX_COMMENT_PAGE_SIZE = 100;

// Comments are shown oldest-first, so pagination pages forward using the last
// comment id seen as the cursor (id ordering matches createdAt ordering here).
export const getComments = async (req: AuthReq, res: Response) => {
  const postId = Number(req.params.postId);
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
  const limitRaw = req.query.limit ? Number(req.query.limit) : COMMENT_PAGE_SIZE;
  const limit = Number.isFinite(limitRaw)
    ? Math.min(Math.max(limitRaw, 1), MAX_COMMENT_PAGE_SIZE)
    : COMMENT_PAGE_SIZE;

  const comments = await prisma.comment.findMany({
    where: { postId, ...(cursor ? { id: { gt: cursor } } : {}) },
    orderBy: { id: "asc" },
    take: limit + 1,
    include: { user: { select: { id: true, username: true } } },
  });
  const hasMore = comments.length > limit;
  const page = hasMore ? comments.slice(0, limit) : comments;
  res.json({ comments: page, nextCursor: hasMore ? page[page.length - 1].id : null });
};

export const createComment = async (req: AuthReq, res: Response) => {
  const postId = Number(req.params.postId);
  const { message } = req.body;
  try {
    const comment = await prisma.comment.create({
      data: { message, userId: req.user!.id, postId },
      include: { user: { select: { id: true, username: true } } },
    });
    res.status(201).json(comment);
  } catch (e) {
    res.status(500).json({ message: "Could not create comment" });
  }
};
