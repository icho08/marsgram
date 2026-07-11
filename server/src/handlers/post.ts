import { Response } from "express";
import prisma from "../db.js";
import { AuthReq } from "../types.js";

const withCounts = async (postId: number, userId: number) => {
  const [likeCount, isLiked, isSaved] = await Promise.all([
    prisma.like.count({ where: { postId } }),
    prisma.like.findUnique({ where: { userId_postId: { userId, postId } } }),
    prisma.save.findUnique({ where: { userId_postId: { userId, postId } } }),
  ]);
  return { likeCount, isLiked: Boolean(isLiked), isSaved: Boolean(isSaved) };
};

const serializePost = async (post: any, userId: number) => {
  const { likeCount, isLiked, isSaved } = await withCounts(post.id, userId);
  return {
    id: post.id,
    createdAt: post.createdAt,
    image: post.image,
    caption: post.caption,
    user: post.user,
    commentCount: post._count?.comments ?? post.comments?.length ?? 0,
    likeCount,
    isLiked,
    isSaved,
  };
};

const PAGE_SIZE = 12;
const MAX_PAGE_SIZE = 50;

// Parses `?cursor=<postId>&limit=n` pagination params shared by the paginated post endpoints.
const parsePageParams = (req: AuthReq) => {
  const cursor = req.query.cursor ? Number(req.query.cursor) : undefined;
  const limitRaw = req.query.limit ? Number(req.query.limit) : PAGE_SIZE;
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), MAX_PAGE_SIZE) : PAGE_SIZE;
  return { cursor: Number.isFinite(cursor) ? cursor : undefined, limit };
};

// Fetches one page of posts ordered newest-first, using the last post id on the
// previous page as an opaque cursor so results stay stable as new posts are added.
const paginate = async (where: Record<string, unknown>, req: AuthReq) => {
  const { cursor, limit } = parsePageParams(req);
  const posts = await prisma.post.findMany({
    where,
    orderBy: { id: "desc" },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    include: {
      user: { select: { id: true, username: true, location: true } },
      _count: { select: { comments: true } },
    },
  });
  const hasMore = posts.length > limit;
  const page = hasMore ? posts.slice(0, limit) : posts;
  const serialized = await Promise.all(page.map((p) => serializePost(p, req.user!.id)));
  return { posts: serialized, nextCursor: hasMore ? page[page.length - 1].id : null };
};

export const getFeed = async (req: AuthReq, res: Response) => {
  res.json(await paginate({}, req));
};

export const createPost = async (req: AuthReq, res: Response) => {
  const { image, caption } = req.body;
  try {
    const post = await prisma.post.create({
      data: { image, caption: caption ?? "", userId: req.user!.id },
      include: {
        user: { select: { id: true, username: true, location: true } },
        _count: { select: { comments: true } },
      },
    });
    res.status(201).json(await serializePost(post, req.user!.id));
  } catch (e) {
    res.status(500).json({ message: "Could not create post" });
  }
};

const INITIAL_COMMENT_PAGE_SIZE = 20;

export const getPost = async (req: AuthReq, res: Response) => {
  const id = Number(req.params.id);
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, username: true, location: true } },
      // Only the first page ships with the post; the client pages the rest via
      // GET /posts/:id/comments to keep large threads from loading all at once.
      comments: {
        orderBy: { id: "asc" },
        take: INITIAL_COMMENT_PAGE_SIZE + 1,
        include: { user: { select: { id: true, username: true } } },
      },
      _count: { select: { comments: true } },
    },
  });
  if (!post) {
    res.status(404).json({ message: "Post not found" });
    return;
  }
  const hasMoreComments = post.comments.length > INITIAL_COMMENT_PAGE_SIZE;
  const comments = hasMoreComments ? post.comments.slice(0, INITIAL_COMMENT_PAGE_SIZE) : post.comments;
  const serialized = await serializePost(post, req.user!.id);
  res.json({
    ...serialized,
    comments,
    nextCommentCursor: hasMoreComments ? comments[comments.length - 1].id : null,
  });
};

export const getPostsByUsername = async (req: AuthReq, res: Response) => {
  const { username } = req.params;
  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    res.status(404).json({ message: "User not found" });
    return;
  }
  res.json(await paginate({ userId: user.id }, req));
};

export const getSavedPosts = async (req: AuthReq, res: Response) => {
  const { cursor, limit } = parsePageParams(req);
  const saves = await prisma.save.findMany({
    where: {
      userId: req.user!.id,
      ...(cursor ? { postId: { lt: cursor } } : {}),
    },
    orderBy: { postId: "desc" },
    take: limit + 1,
    include: {
      post: {
        include: {
          user: { select: { id: true, username: true, location: true } },
          _count: { select: { comments: true } },
        },
      },
    },
  });
  const hasMore = saves.length > limit;
  const page = hasMore ? saves.slice(0, limit) : saves;
  const serialized = await Promise.all(page.map((s) => serializePost(s.post, req.user!.id)));
  res.json({ posts: serialized, nextCursor: hasMore ? page[page.length - 1].postId : null });
};
