import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import morgan from "morgan";
import { createServer } from "node:http";
import { Server as SocketServer } from "socket.io";
import jwt from "jsonwebtoken";
import prisma from "./db.js";
import { createRouter } from "./router.js";
import { JwtUser, SyncErr } from "./types.js";

export const createApp = () => {
  const app = express();
  const httpServer = createServer(app);
  const io = new SocketServer(httpServer, {
    cors: { origin: true, credentials: true },
  });

  // Authenticate socket connections with the same JWT used for REST calls,
  // then join a room per conversation so message events only reach participants.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error("Not authorized"));
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET ?? "");
      (socket.data as { user?: unknown }).user = user;
      next();
    } catch {
      next(new Error("Not authorized"));
    }
  });

  io.on("connection", (socket) => {
    const socketUser = (socket.data as { user?: JwtUser }).user;

    // Only let a socket join a conversation room if its authenticated user is
    // actually a participant — otherwise any signed-in user could pass an
    // arbitrary conversation id and eavesdrop on someone else's messages.
    socket.on("joinConversation", async (conversationId: number) => {
      if (!socketUser) return;
      const membership = await prisma.conversation.findFirst({
        where: { id: Number(conversationId), users: { some: { id: socketUser.id } } },
        select: { id: true },
      });
      if (membership) {
        socket.join(`conversation:${conversationId}`);
      }
    });
    socket.on("leaveConversation", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
    });
  });

  app.use(cors());
  app.use(morgan("dev"));
  app.use(express.json({ limit: "8mb" }));
  app.use(express.urlencoded({ extended: true }));

  app.get("/health_status", (_req, res) => {
    res.status(200).json({ message: "the server is running" });
  });

  app.use("/api", createRouter(io));

  app.use((err: SyncErr, _req: Request, res: Response, _next: NextFunction) => {
    if (err.type === "auth") {
      res.status(401).json({ message: "unauthorized" });
    } else if (err.type === "input") {
      res.status(400).json({ message: "invalid input" });
    } else {
      // eslint-disable-next-line no-console
      console.error(err);
      res.status(500).json({ message: "server error" });
    }
  });

  return httpServer;
};
