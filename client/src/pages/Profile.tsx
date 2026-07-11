import { Link, useParams } from "react-router-dom";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/halftone/AppShell";
import { InkAvatar } from "@/components/halftone/InkAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { api, type ApiPost, type ApiUser, type PaginatedPosts } from "@/lib/api";

const formatCount = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : `${n}`);

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<ApiUser | null | undefined>(undefined);
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [togglingFollow, setTogglingFollow] = useState(false);

  const load = useCallback(() => {
    if (!username) return;
    api<ApiUser>(`/users/${username}`)
      .then((u) => {
        setProfile(u);
        return api<PaginatedPosts>(`/users/${username}/posts`);
      })
      .then((page) => {
        setPosts(page.posts);
        setNextCursor(page.nextCursor);
      })
      .catch(() => setProfile(null));
  }, [username]);

  const loadMore = useCallback(() => {
    if (!username || !nextCursor || loadingMore) return;
    setLoadingMore(true);
    api<PaginatedPosts>(`/users/${username}/posts?cursor=${nextCursor}`)
      .then((page) => {
        setPosts((prev) => [...prev, ...page.posts]);
        setNextCursor(page.nextCursor);
      })
      .finally(() => setLoadingMore(false));
  }, [username, nextCursor, loadingMore]);

  useEffect(() => {
    load();
  }, [load]);

  if (profile === undefined) {
    return (
      <AppShell>
        <p className="font-space text-xs uppercase tracking-widest text-ink/40">Loading…</p>
      </AppShell>
    );
  }

  if (!profile) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-24 text-center">
          <p className="font-space text-sm font-bold uppercase">Not in the register</p>
          <Link to="/" className="mt-4 inline-block font-space text-[11px] underline underline-offset-4">
            Back to the feed
          </Link>
        </div>
      </AppShell>
    );
  }

  const isOwn = me?.id === profile.id;

  const toggleFollow = async () => {
    setTogglingFollow(true);
    try {
      const res = await api<{ isFollowing: boolean; followers: number }>(`/follow/${profile.id}`, {
        method: "POST",
      });
      setProfile((p) => (p ? { ...p, isFollowing: res.isFollowing, followers: res.followers } : p));
    } finally {
      setTogglingFollow(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-10 grid grid-cols-[auto_minmax(0,1fr)] items-start gap-6 md:gap-10">
          <InkAvatar name={profile.username} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="truncate font-space text-lg font-bold uppercase tracking-tight">
                {profile.username}
              </h1>
              {isOwn ? (
                <Link
                  to="/settings"
                  className="border border-ink px-4 py-1.5 font-space text-[10px] font-bold uppercase tracking-widest transition-colors hover:bg-surface"
                >
                  Edit Studio
                </Link>
              ) : (
                <button
                  onClick={toggleFollow}
                  disabled={togglingFollow}
                  className={`px-4 py-1.5 font-space text-[10px] font-bold uppercase tracking-widest ring-1 ring-ink transition-colors disabled:opacity-50 ${
                    profile.isFollowing ? "bg-paper text-ink hover:bg-surface" : "bg-ink text-paper hover:bg-ink-muted"
                  }`}
                >
                  {profile.isFollowing ? "Subscribed ✓" : "Subscribe"}
                </button>
              )}
              {!isOwn && (
                <Link
                  to={`/messages/${profile.username}`}
                  className="font-space text-[10px] uppercase tracking-widest text-ink/40 underline underline-offset-4 hover:text-ink"
                >
                  Message
                </Link>
              )}
            </div>
            <p className="mt-2 text-sm font-medium">{profile.name}</p>
            {profile.location && (
              <p className="font-space text-[10px] uppercase tracking-widest text-ink/40">{profile.location}</p>
            )}
            {profile.bio && <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-ink-muted">{profile.bio}</p>}
          </div>
        </header>

        <div className="mb-10 grid grid-cols-3 border-y border-ink/10 py-4 text-center font-space">
          <div>
            <span className="block text-lg font-bold">{posts.length}</span>
            <span className="text-[9px] uppercase tracking-widest text-ink/50">Prints</span>
          </div>
          <div>
            <span className="block text-lg font-bold">{formatCount(profile.followers ?? 0)}</span>
            <span className="text-[9px] uppercase tracking-widest text-ink/50">Readers</span>
          </div>
          <div>
            <span className="block text-lg font-bold">{formatCount(profile.following ?? 0)}</span>
            <span className="text-[9px] uppercase tracking-widest text-ink/50">Following</span>
          </div>
        </div>

        {posts.length > 0 ? (
          <div className="grid grid-cols-2 gap-1 md:grid-cols-3">
            {posts.map((post) => (
              <Link key={post.id} to={`/${profile.username}/${post.id}`} className="group relative block">
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
        ) : (
          <p className="font-space text-xs text-ink/40">No plates printed yet.</p>
        )}

        {nextCursor && (
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="mx-auto mt-6 block border border-ink/20 px-6 py-2 font-space text-[11px] font-bold uppercase tracking-widest transition-colors hover:bg-surface disabled:opacity-50"
          >
            {loadingMore ? "Loading…" : "Load More"}
          </button>
        )}
      </div>
    </AppShell>
  );
}
