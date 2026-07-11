import { Request } from "express";

export interface JwtUser {
  id: number;
  username: string;
}

export interface AuthReq extends Request {
  user?: JwtUser;
}

export interface SyncErr extends Error {
  type?: "auth" | "input" | "notfound";
}

export interface SocketMessage {
  conversationId: number;
  message: string;
}
