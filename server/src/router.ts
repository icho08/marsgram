import { Router } from "express";
import { body } from "express-validator";
import type { Server as SocketServer } from "socket.io";
import { handleInputErrors } from "./modules/middleware.js";
import { protect } from "./modules/auth.js";
import {
  createNewUser,
  signIn,
  getMe,
  updateMe,
  getUserByUsername,
  searchUsers,
} from "./handlers/user.js";
import { getFeed, createPost, getPost, getPostsByUsername, getSavedPosts } from "./handlers/post.js";
import { createComment, getComments } from "./handlers/comment.js";
import { toggleLike } from "./handlers/like.js";
import { toggleSave } from "./handlers/save.js";
import { toggleFollow, searchSubscribers } from "./handlers/follow.js";
import { getConversations, getOrCreateConversationWithUser } from "./handlers/conversation.js";
import { createMessage } from "./handlers/message.js";

export const createRouter = (io: SocketServer): Router => {
  const router = Router();

  // Auth (public)
  router.post(
    "/sign_up",
    body("email").isEmail(),
    body("username").isString().isLength({ min: 3, max: 20 }),
    body("password").isString().isLength({ min: 4 }),
    body("name").isString().isLength({ min: 1, max: 40 }),
    handleInputErrors,
    createNewUser,
  );
  router.post(
    "/sign_in",
    body("email").isEmail(),
    body("password").isString(),
    handleInputErrors,
    signIn,
  );

  // Everything below requires a valid JWT
  router.use(protect);

  router.get("/me", getMe);
  router.patch("/me", updateMe);
  router.get("/users/search", searchUsers);
  router.get("/users/subscribers", searchSubscribers);
  router.get("/users/:username", getUserByUsername);
  router.get("/users/:username/posts", getPostsByUsername);

  router.get("/posts", getFeed);
  router.post(
    "/posts",
    body("image").isString().notEmpty(),
    body("caption").optional().isString(),
    handleInputErrors,
    createPost,
  );
  router.get("/posts/saved", getSavedPosts);
  router.get("/posts/:id", getPost);
  router.post("/posts/:postId/like", toggleLike);
  router.post("/posts/:postId/save", toggleSave);
  router.get("/posts/:postId/comments", getComments);
  router.post(
    "/posts/:postId/comments",
    body("message").isString().isLength({ min: 1, max: 500 }),
    handleInputErrors,
    createComment,
  );

  router.post("/follow/:userId", toggleFollow);

  router.get("/conversations", getConversations);
  router.get("/conversations/with/:otherUsername", getOrCreateConversationWithUser);
  router.post(
    "/conversations/:conversationId/messages",
    body("message").isString().isLength({ min: 1, max: 2000 }),
    handleInputErrors,
    createMessage(io),
  );

  return router;
};
