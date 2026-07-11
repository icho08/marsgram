import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState, type ReactNode } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api, type ApiUser } from "@/lib/api";
import { InkAvatar } from "./InkAvatar";

function Marker({ active }: { active: boolean }) {
  return (
    <span
      className={active ? "size-4 shrink-0 rounded-full bg-ink" : "size-4 shrink-0 border border-ink"}
    />
  );
}

function NavLink({
  to,
  label,
  pathname,
  exact = true,
}: {
  to: string;
  label: string;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact ? pathname === to : pathname.startsWith(to);
  return (
    <li>
      <Link
        to={to}
        className="flex items-center gap-3 py-1 font-space text-sm font-medium transition-colors hover:text-ink-muted"
      >
        <Marker active={active} />
        {label}
      </Link>
    </li>
  );
}

function SearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiUser[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      return;
    }
    const timeout = setTimeout(() => {
      api<ApiUser[]>(`/users/search?q=${encodeURIComponent(q)}`)
        .then(setResults)
        .catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(timeout);
  }, [query]);

  return (
    <div className="fixed inset-0 z-40 bg-ink/20" onClick={onClose}>
      <div
        className="absolute left-0 top-0 h-full w-full max-w-xs border-r border-ink/10 bg-paper p-6 md:left-64"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-space text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40">
          Search the Register
        </h2>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Username, name, city…"
          className="mb-6 w-full border border-ink/20 bg-transparent px-3 py-2 font-space text-sm outline-none placeholder:text-ink/30 focus:border-ink"
        />
        <ul className="space-y-4">
          {results.map((u) => (
            <li key={u.id}>
              <Link
                to={`/${u.username}`}
                onClick={onClose}
                className="flex items-center gap-3 hover:opacity-70"
              >
                <InkAvatar name={u.username} />
                <span className="min-w-0">
                  <span className="block truncate font-space text-xs font-bold">{u.username}</span>
                  <span className="block truncate text-[11px] text-ink/50">{u.location}</span>
                </span>
              </Link>
            </li>
          ))}
          {query && results.length === 0 && (
            <li className="font-space text-xs text-ink/40">No entries in the register.</li>
          )}
        </ul>
      </div>
    </div>
  );
}

function NewPostPanel({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!preview) {
      setError("Select a photograph first.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await api("/posts", { method: "POST", body: JSON.stringify({ image: preview, caption }) });
      onCreated();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 grid place-items-center bg-ink/30 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md border border-ink/15 bg-paper p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-baseline justify-between border-b border-ink/10 pb-2">
          <h2 className="font-space text-sm font-bold uppercase tracking-tight">New Plate</h2>
          <button onClick={onClose} className="font-space text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink">
            Close
          </button>
        </div>

        <label className="mb-4 grid aspect-square w-full cursor-pointer place-items-center border border-dashed border-ink/30 bg-surface/50">
          {preview ? (
            <img src={preview} alt="Upload preview" className="h-full w-full object-cover" />
          ) : (
            <span className="font-space text-[10px] uppercase tracking-[0.2em] text-ink/40">
              Select photograph
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </label>

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Caption for the record…"
          rows={3}
          className="mb-4 w-full resize-none border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
        />

        {error && <p className="mb-3 font-space text-[10px] uppercase tracking-widest text-red-600">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full bg-ink py-2 font-space text-[11px] font-bold uppercase tracking-widest text-paper transition-colors hover:bg-ink-muted disabled:opacity-50"
        >
          {submitting ? "Sending…" : "Send to Press"}
        </button>
      </div>
    </div>
  );
}

export function AppShell({ children, onPostCreated }: { children: ReactNode; onPostCreated?: () => void }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [newPostOpen, setNewPostOpen] = useState(false);
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-paper font-rubik text-ink antialiased">
      {/* Desktop sidebar */}
      <nav className="fixed left-0 top-0 z-30 hidden h-full w-64 flex-col border-r border-ink/10 p-8 md:flex">
        <div className="mb-12">
          <Link to="/" className="font-space text-xl font-bold uppercase tracking-tighter">
            Halftone
          </Link>
        </div>

        <ul className="flex-1 space-y-4">
          <NavLink to="/" label="Home" pathname={pathname} />
          <li>
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-3 py-1 font-space text-sm font-medium transition-colors hover:text-ink-muted"
            >
              <Marker active={searchOpen} /> Search
            </button>
          </li>
          <li>
            <button
              onClick={() => setNewPostOpen(true)}
              className="flex items-center gap-3 py-1 font-space text-sm font-medium transition-colors hover:text-ink-muted"
            >
              <Marker active={newPostOpen} /> New Post
            </button>
          </li>
          <NavLink to="/messages" label="Messages" pathname={pathname} exact={false} />
          <NavLink to="/saved" label="Saved" pathname={pathname} />
          {user && <NavLink to={`/${user.username}`} label="Profile" pathname={pathname} />}
        </ul>

        <div className="space-y-3 border-t border-ink/5 pt-8">
          <Link
            to="/settings"
            className="block font-space text-xs font-medium uppercase tracking-widest text-ink/40 transition-colors hover:text-ink"
          >
            Settings
          </Link>
          <button
            onClick={handleLogout}
            className="font-space text-xs font-medium uppercase tracking-widest text-ink/40 transition-colors hover:text-ink"
          >
            Log Out
          </button>
        </div>
      </nav>

      {/* Mobile top bar */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-ink/10 bg-paper px-5 md:hidden">
        <Link to="/" className="font-space text-lg font-bold uppercase tracking-tighter">
          Halftone
        </Link>
        <Link to="/settings" className="font-space text-[10px] uppercase tracking-widest text-ink/40">
          Settings
        </Link>
      </header>

      {/* Mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-30 flex h-14 items-center justify-around border-t border-ink/10 bg-paper md:hidden">
        <Link to="/" className="p-2" aria-label="Home">
          <Marker active={pathname === "/"} />
        </Link>
        <button onClick={() => setSearchOpen(true)} className="p-2 font-space text-[10px] uppercase" aria-label="Search">
          Search
        </button>
        <button onClick={() => setNewPostOpen(true)} className="p-2 font-space text-[10px] uppercase" aria-label="New post">
          Post
        </button>
        <Link to="/messages" className="p-2 font-space text-[10px] uppercase">
          DMs
        </Link>
        {user && (
          <Link to={`/${user.username}`} className="p-2" aria-label="Profile">
            <InkAvatar name={user.username} size="sm" />
          </Link>
        )}
      </nav>

      <main className="px-5 pb-24 pt-20 md:ml-64 md:px-12 md:pb-16 md:pt-16">{children}</main>

      {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
      {newPostOpen && (
        <NewPostPanel onClose={() => setNewPostOpen(false)} onCreated={() => onPostCreated?.()} />
      )}
    </div>
  );
}
