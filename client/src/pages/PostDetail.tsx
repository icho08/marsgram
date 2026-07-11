import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/halftone/AppShell";
import { InkAvatar } from "@/components/halftone/InkAvatar";
import { api, type ApiComment, type ApiPost, type PaginatedComments } from "@/lib/api";

const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

export default function PostDetailPage() {
  const { postId } = useParams();
  const [post, setPost] = useState<ApiPost | null | undefined>(undefined);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [nextCommentCursor, setNextCommentCursor] = useState<number | null>(null);
  const [loadingMoreComments, setLoadingMoreComments] = useState(false);
  const [draft, setDraft] = useState("");
  const [posting, setPosting] = useState(false);

  const load = useCallback(() => {
    if (!postId) return;
    api<ApiPost>(`/posts/${postId}`)
      .then((p) => {
        setPost(p);
        setComments(p.comments ?? []);
        setNextCommentCursor(p.nextCommentCursor ?? null);
      })
      .catch(() => setPost(null));
  }, [postId]);

  const loadMoreComments = useCallback(() => {
    if (!post || !nextCommentCursor || loadingMoreComments) return;
    setLoadingMoreComments(true);
    api<PaginatedComments>(`/posts/${post.id}/comments?cursor=${nextCommentCursor}`)
      .then((page) => {
        setComments((prev) => [...prev, ...page.comments]);
        setNextCommentCursor(page.nextCursor);
      })
      .finally(() => setLoadingMoreComments(false));
  }, [post, nextCommentCursor, loadingMoreComments]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleLike = async () => {
    if (!post) return;
    try {
      const res = await api<{ isLiked: boolean; likeCount: number }>(`/posts/${post.id}/like`, {
        method: "POST",
      });
      setPost((p) => (p ? { ...p, isLiked: res.isLiked, likeCount: res.likeCount } : p));
    } catch {
      // ignore
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;
    const text = draft.trim();
    if (!text) return;
    setPosting(true);
    try {
      const comment = await api<ApiComment>(`/posts/${post.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setComments((prev) => [...prev, comment]);
      setPost((p) => (p ? { ...p, commentCount: p.commentCount + 1 } : p));
      setDraft("");
    } finally {
      setPosting(false);
    }
  };

  if (post === undefined) {
    return (
      <AppShell>
        <p className="font-space text-xs uppercase tracking-widest text-ink/40">Loading…</p>
      </AppShell>
    );
  }

  if (!post) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-24 text-center">
          <p className="font-space text-sm font-bold uppercase">Plate not found</p>
          <Link to="/" className="mt-4 inline-block font-space text-[11px] underline underline-offset-4">
            Back to the feed
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto grid max-w-5xl gap-10 md:grid-cols-[1.2fr_1fr]">
        <div>
          <div className="bg-surface p-1 ring-1 ring-ink/5">
            <img src={post.image} alt={post.caption} className="aspect-square w-full object-cover" />
          </div>
          <p className="mt-2 text-right font-space text-[10px] uppercase tracking-widest text-ink/40">
            Plate No. {post.id} // {new Date(post.createdAt).toLocaleString()}
          </p>
        </div>

        <div className="flex flex-col">
          <header className="mb-4 flex items-center justify-between border-b border-ink/10 pb-4">
            <Link to={`/${post.user.username}`} className="flex items-center gap-3 hover:opacity-70">
              <InkAvatar name={post.user.username} size="sm" />
              <div>
                <p className="font-space text-xs font-bold uppercase tracking-tight">{post.user.username}</p>
                <p className="text-[10px] text-ink/50">{post.user.location}</p>
              </div>
            </Link>
          </header>

          <p className="mb-6 text-pretty text-sm leading-relaxed">{post.caption}</p>

          <div className="mb-6 flex items-center gap-6 border-y border-ink/10 py-3">
            <button
              onClick={toggleLike}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-ink/60"
              aria-pressed={post.isLiked}
            >
              <span className={`size-4 shrink-0 rounded-sm ${post.isLiked ? "bg-ink" : "border border-ink"}`} />
              <span className="font-space text-[11px] uppercase tracking-tighter">
                {formatCount(post.likeCount)}
              </span>
            </button>
            <span className="flex items-center gap-2 text-sm font-medium">
              <span className="size-4 shrink-0 rounded-sm border border-ink" />
              <span className="font-space text-[11px] uppercase tracking-tighter">
                {post.commentCount}
              </span>
            </span>
          </div>

          <ul className="mb-6 flex-1 space-y-4 overflow-y-auto">
            {comments.map((c) => (
              <li key={c.id}>
                <p className="text-sm leading-relaxed">
                  <Link to={`/${c.user.username}`} className="font-space text-xs font-bold uppercase">
                    {c.user.username}
                  </Link>{" "}
                  {c.message}
                </p>
              </li>
            ))}
            {comments.length === 0 && (
              <li className="font-space text-xs text-ink/40">No annotations yet.</li>
            )}
            {nextCommentCursor && (
              <li>
                <button
                  onClick={loadMoreComments}
                  disabled={loadingMoreComments}
                  className="font-space text-[10px] uppercase tracking-widest text-ink/40 underline underline-offset-4 hover:text-ink disabled:opacity-50"
                >
                  {loadingMoreComments ? "Loading…" : "Load older annotations"}
                </button>
              </li>
            )}
          </ul>

          <form onSubmit={handleComment} className="flex gap-2 border-t border-ink/10 pt-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Annotate this plate…"
              className="flex-1 border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
            />
            <button
              type="submit"
              disabled={posting}
              className="bg-ink px-5 py-2 font-space text-[11px] font-bold uppercase tracking-widest text-paper transition-colors hover:bg-ink-muted disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </AppShell>
  );
}
