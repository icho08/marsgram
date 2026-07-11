import { Link } from "react-router-dom";
import { useState } from "react";
import { api, type ApiPost } from "@/lib/api";
import { InkAvatar } from "./InkAvatar";

const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);
const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

export function PostCard({ post, index }: { post: ApiPost; index: number }) {
  const [liked, setLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [saved, setSaved] = useState(post.isSaved);

  const toggleLike = async () => {
    setLiked((v) => !v);
    setLikeCount((c) => c + (liked ? -1 : 1));
    try {
      const res = await api<{ isLiked: boolean; likeCount: number }>(`/posts/${post.id}/like`, {
        method: "POST",
      });
      setLiked(res.isLiked);
      setLikeCount(res.likeCount);
    } catch {
      setLiked((v) => !v);
      setLikeCount((c) => c + (liked ? 1 : -1));
    }
  };

  const toggleSave = async () => {
    setSaved((v) => !v);
    try {
      const res = await api<{ isSaved: boolean }>(`/posts/${post.id}/save`, { method: "POST" });
      setSaved(res.isSaved);
    } catch {
      setSaved((v) => !v);
    }
  };

  return (
    <article>
      <header className="mb-4 flex items-baseline justify-between border-b border-ink/5 pb-2">
        <Link to={`/${post.user.username}`} className="flex items-center gap-3 hover:opacity-70">
          <InkAvatar name={post.user.username} size="sm" />
          <span className="font-space text-sm font-bold uppercase tracking-tight">
            {post.user.username}
          </span>
        </Link>
        <span className="font-space text-[10px] uppercase tracking-widest text-ink/40">
          No. {index} // {formatTime(post.createdAt)}
        </span>
      </header>

      <Link to={`/${post.user.username}/${post.id}`} className="block">
        <div className="bg-surface p-1 ring-1 ring-ink/5">
          <img
            src={post.image}
            alt={post.caption}
            loading="lazy"
            className="aspect-square w-full object-cover"
          />
        </div>
      </Link>

      <div className="mt-6 grid grid-cols-[1fr_auto] gap-8">
        <div className="space-y-4">
          <p className="max-w-[56ch] text-pretty leading-relaxed text-ink">{post.caption}</p>
          <div className="flex gap-6">
            <button
              onClick={toggleLike}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-ink/60"
              aria-pressed={liked}
              aria-label="Like"
            >
              <span className={`size-4 shrink-0 rounded-sm ${liked ? "bg-ink" : "border border-ink"}`} />
              <span className="font-space text-[11px] uppercase tracking-tighter">
                {formatCount(likeCount)}
              </span>
            </button>
            <Link
              to={`/${post.user.username}/${post.id}`}
              className="flex items-center gap-2 text-sm font-medium transition-colors hover:text-ink/60"
              aria-label="Comments"
            >
              <span className="size-4 shrink-0 rounded-sm border border-ink" />
              <span className="font-space text-[11px] uppercase tracking-tighter">
                {post.commentCount}
              </span>
            </Link>
          </div>
        </div>

        <aside className="flex flex-col justify-end text-right">
          <button
            onClick={toggleSave}
            className={`flex items-center gap-2 rounded-sm py-2 pl-2 pr-3 text-sm font-medium ring-1 ring-ink transition-colors ${
              saved ? "bg-ink text-paper hover:bg-ink-muted" : "text-ink hover:bg-surface"
            }`}
            aria-pressed={saved}
          >
            <span className={`size-4 shrink-0 border ${saved ? "border-paper/30" : "border-ink/30"}`} />
            <span className="font-space text-[11px] uppercase tracking-tighter">
              {saved ? "Indexed" : "Save Index"}
            </span>
          </button>
        </aside>
      </div>
    </article>
  );
}
