import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";
import type { Server as SocketServer } from "socket.io";

export const createMessage =
  (io: SocketServer) =>
  async (req: AuthReq, res: Response) => {
    const conversationId = Number(req.params.conversationId);
    const { message } = req.body;
    const senderId = req.user!.id;

    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, users: { some: { id: senderId } } },
      include: { users: true },
    });
    if (!conversation) {
      res.status(404).json({ message: "Conversation not found" });
      return;
    }

    const created = await prisma.message.create({
      data: { conversationId, senderId, message },
    });

    io.to(`conversation:${conversationId}`).emit("newMessage", created);
    res.status(201).json(created);
  };
