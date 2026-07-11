import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AppShell } from "@/components/halftone/AppShell";
import { PostCard } from "@/components/halftone/PostCard";
import { InkAvatar } from "@/components/halftone/InkAvatar";
import { api, type ApiPost, type ApiUser, type PaginatedPosts } from "@/lib/api";

export default function FeedPage() {
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [subscribers, setSubscribers] = useState<ApiUser[]>([]);

  const loadFeed = useCallback(() => {
    api<PaginatedPosts>("/posts")
      .then((page) => {
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch(() => setPosts([]));
  }, []);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    api<PaginatedPosts>(`/posts?cursor=${nextCursor}`)
      .then((page) => {
        setPosts((prev) => [...(prev ?? []), ...page.posts]);
        setNextCursor(page.nextCursor);
      })
      .finally(() => setLoadingMore(false));
  }, [nextCursor, loadingMore]);

  useEffect(() => {
    loadFeed();
    api<ApiUser[]>("/users/subscribers").then(setSubscribers).catch(() => setSubscribers([]));
  }, [loadFeed]);

  return (
    <AppShell onPostCreated={loadFeed}>
      <div className="flex justify-center">
        <div className="w-full max-w-[640px] space-y-24">
          <h1 className="sr-only">Halftone — the feed</h1>
          {posts === null && (
            <p className="font-space text-xs uppercase tracking-widest text-ink/40">Loading plates…</p>
          )}
          {posts?.length === 0 && (
            <p className="font-space text-xs uppercase tracking-widest text-ink/40">
              No plates yet. Be the first to post.
            </p>
          )}
          {posts?.map((post, i) => (
            <PostCard key={post.id} post={post} index={posts.length - i} />
          ))}
          {nextCursor && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="mx-auto block border border-ink/20 px-6 py-2 font-space text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-surface disabled:opacity-50"
            >
              {loadingMore ? "Loading…" : "Load Older Plates"}
            </button>
          )}
        </div>

        <aside className="ml-24 hidden w-64 space-y-12 xl:block">
          <section>
            <h2 className="mb-6 font-space text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">
              New Subscribers
            </h2>
            <div className="space-y-6">
              {subscribers.map((u) => (
                <Link key={u.id} to={`/${u.username}`} className="flex items-center gap-4 hover:opacity-70">
                  <InkAvatar name={u.username} />
                  <div className="min-w-0">
                    <p className="truncate font-space text-xs font-bold">{u.username}</p>
                    <p className="truncate text-[10px] text-ink/50">{u.location}</p>
                  </div>
                </Link>
              ))}
              {subscribers.length === 0 && (
                <p className="font-space text-[10px] text-ink/40">No one else has joined yet.</p>
              )}
            </div>
          </section>

          <section className="border border-ink/5 bg-surface/50 p-6">
            <h2 className="mb-3 font-space text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">
              Halftone Digest
            </h2>
            <p className="text-xs leading-relaxed text-ink-muted">
              Volume IV is currently in production. Registered members receive the physical print
              edition quarterly.
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}
