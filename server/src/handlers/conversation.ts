import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";

export const getConversations = async (req: AuthReq, res: Response) => {
  const userId = req.user!.id;
  const conversations = await prisma.conversation.findMany({
    where: { users: { some: { id: userId } } },
    include: {
      users: { select: { id: true, username: true, location: true } },
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
    },
  });
  const serialized = conversations
    .map((c) => ({
      id: c.id,
      otherUser: c.users.find((u) => u.id !== userId),
      lastMessage: c.messages[0] ?? null,
    }))
    .filter((c) => c.otherUser)
    .sort((a, b) => {
      const at = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bt = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bt - at;
    });
  res.json(serialized);
};

// Finds (or creates) the 1:1 conversation between the current user and another user
// (identified by username), then returns it with full message history.
export const getOrCreateConversationWithUser = async (req: AuthReq, res: Response) => {
  const userId = req.user!.id;
  const otherUsername = req.params.otherUsername;

  const otherUser = await prisma.user.findUnique({ where: { username: otherUsername } });
  if (!otherUser) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  const otherUserId = otherUser.id;
  if (otherUserId === userId) {
    res.status(400).json({ message: "Cannot message yourself" });
    return;
  }

  let conversation = await prisma.conversation.findFirst({
    where: {
      AND: [{ users: { some: { id: userId } } }, { users: { some: { id: otherUserId } } }],
    },
    include: {
      users: { select: { id: true, username: true, location: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: { users: { connect: [{ id: userId }, { id: otherUserId }] } },
      include: {
        users: { select: { id: true, username: true, location: true } },
        messages: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  res.json({
    id: conversation.id,
    otherUser: conversation.users.find((u) => u.id !== userId),
    messages: conversation.messages,
  });
};
