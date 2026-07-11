import { Link } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/halftone/AppShell";
import { api, type ApiPost, type PaginatedPosts } from "@/lib/api";

export default function SavedPage() {
  const [posts, setPosts] = useState<ApiPost[] | null>(null);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    api<PaginatedPosts>("/posts/saved")
      .then((page) => {
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch(() => setPosts([]));
  }, []);

  const loadMore = useCallback(() => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    api<PaginatedPosts>(`/posts/saved?cursor=${nextCursor}`)
      .then((page) => {
        setPosts((prev) => [...(prev ?? []), ...page.posts]);
        setNextCursor(page.nextCursor);
      })
      .finally(() => setLoadingMore(false));
  }, [nextCursor, loadingMore]);

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 border-b border-ink/10 pb-4">
          <h1 className="font-space text-xl font-bold uppercase tracking-tighter">Saved Index</h1>
          <p className="mt-1 font-space text-[10px] uppercase tracking-widest text-ink/40">
            {posts?.length ?? 0} plates in your collection
          </p>
        </header>

        <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
          {posts?.map((post) => (
            <Link key={post.id} to={`/${post.user.username}/${post.id}`} className="group relative block">
              <img
                src={post.image}
                alt={post.caption}
                loading="lazy"
                className="aspect-square w-full object-cover"
              />
              <span className="absolute inset-0 grid place-items-center bg-ink/60 font-space text-[10px] uppercase tracking-[0.2em] text-paper opacity-0 transition-opacity group-hover:opacity-100">
                No. {post.id}
              </span>
            </Link>
          ))}
        </div>

        {posts?.length === 0 && <p className="font-space text-xs text-ink/40">Nothing indexed yet.</p>}

        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mx-auto mt-8 block border border-ink/20 px-6 py-2 font-space text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-surface disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
