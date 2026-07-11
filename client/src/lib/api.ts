const TOKEN_KEY = "halftone_token";

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token: string) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`/api${path}`, { ...options, headers });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const body = await res.json();
      message = body.message ?? body.errors?.[0]?.msg ?? message;
    } catch {
      // ignore parse failure
    }
    throw new ApiError(message, res.status);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

// --- Types shared with the server's JSON shapes ---

export interface ApiUser {
  id: number;
  username: string;
  name: string;
  location: string | null;
  bio: string | null;
  email?: string;
  followers?: number;
  following?: number;
  isFollowing?: boolean;
}

export interface ApiComment {
  id: number;
  message: string;
  createdAt: string;
  userId: number;
  user: { id: number; username: string };
}

export interface ApiPost {
  id: number;
  createdAt: string;
  image: string;
  caption: string;
  user: { id: number; username: string; location: string | null };
  commentCount: number;
  likeCount: number;
  isLiked: boolean;
  isSaved: boolean;
  comments?: ApiComment[];
  nextCommentCursor?: number | null;
}

export interface PaginatedPosts {
  posts: ApiPost[];
  nextCursor: number | null;
}

export interface PaginatedComments {
  comments: ApiComment[];
  nextCursor: number | null;
}

export interface ApiMessage {
  id: number;
  message: string;
  createdAt: string;
  senderId: number;
  conversationId: number;
}

export interface ApiConversationSummary {
  id: number;
  otherUser: { id: number; username: string; location: string | null };
  lastMessage: ApiMessage | null;
}

export interface ApiConversation {
  id: number;
  otherUser: { id: number; username: string; location: string | null };
  messages: ApiMessage[];
}
