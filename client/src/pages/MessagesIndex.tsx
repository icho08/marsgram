import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/halftone/AppShell";
import { InkAvatar } from "@/components/halftone/InkAvatar";
import { api, type ApiConversationSummary } from "@/lib/api";

export default function MessagesIndexPage() {
  const [conversations, setConversations] = useState<ApiConversationSummary[] | null>(null);

  useEffect(() => {
    api<ApiConversationSummary[]>("/conversations").then(setConversations).catch(() => setConversations([]));
  }, []);

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <header className="mb-8 border-b border-ink/10 pb-4">
          <h1 className="font-space text-xl font-bold uppercase tracking-tighter">Correspondence</h1>
          <p className="mt-1 font-space text-[10px] uppercase tracking-widest text-ink/40">
            {conversations?.length ?? 0} open threads
          </p>
        </header>

        <ul>
          {conversations?.map((convo) => (
            <li key={convo.id} className="border-b border-ink/5">
              <Link
                to={`/messages/${convo.otherUser.username}`}
                className="flex items-center gap-4 py-4 transition-colors hover:bg-surface/40"
              >
                <InkAvatar name={convo.otherUser.username} />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-space text-xs font-bold">{convo.otherUser.username}</p>
                  <p className="truncate text-sm text-ink-muted">
                    {convo.lastMessage?.message ?? "No messages yet"}
                  </p>
                </div>
              </Link>
            </li>
          ))}
          {conversations?.length === 0 && (
            <li className="font-space text-xs text-ink/40">
              No correspondence yet. Visit a profile and choose Message to start one.
            </li>
          )}
        </ul>
      </div>
    </AppShell>
  );
}
