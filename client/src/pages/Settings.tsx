import { useState } from "react";
import { AppShell } from "@/components/halftone/AppShell";
import { useAuth } from "@/contexts/AuthContext";
import { api, type ApiUser } from "@/lib/api";

const fieldClass =
  "w-full border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/30 focus:border-ink";
const labelClass =
  "mb-2 block font-space text-[10px] font-medium uppercase tracking-[0.2em] text-ink/40";

export default function SettingsPage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user?.name ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [savedFlash, setSavedFlash] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api<ApiUser>("/me", {
        method: "PATCH",
        body: JSON.stringify({ name, location, bio }),
      });
      updateUser(updated);
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <header className="mb-10 border-b border-ink/10 pb-4">
          <h1 className="font-space text-xl font-bold uppercase tracking-tighter">Studio Settings</h1>
        </header>

        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className={labelClass}>Username</label>
            <input value={user?.username ?? ""} disabled className={`${fieldClass} font-space opacity-50`} />
          </div>
          <div>
            <label htmlFor="name" className={labelClass}>
              Display Name
            </label>
            <input id="name" value={name} onChange={(e) => setName(e.target.value)} className={fieldClass} />
          </div>
          <div>
            <label htmlFor="location" className={labelClass}>
              Location
            </label>
            <input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className={fieldClass}
            />
          </div>
          <div>
            <label htmlFor="bio" className={labelClass}>
              Colophon / Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className={`${fieldClass} resize-none`}
            />
          </div>

          <div className="flex items-center gap-4 border-t border-ink/10 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="bg-ink px-6 py-2 font-space text-[11px] font-bold uppercase tracking-widest text-paper transition-colors hover:bg-ink-muted disabled:opacity-50"
            >
              Commit Changes
            </button>
            {savedFlash && (
              <span className="font-space text-[10px] uppercase tracking-widest text-ink/50">
                Saved to press ✓
              </span>
            )}
          </div>
        </form>
      </div>
    </AppShell>
  );
}
