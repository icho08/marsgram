import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/halftone/AppShell";
import { InkAvatar } from "@/components/halftone/InkAvatar";
import { useAuth } from "@/contexts/AuthContext";
import { api, type ApiConversation, type ApiMessage } from "@/lib/api";
import { getSocket } from "@/lib/socket";

export default function ConversationPage() {
  const { otherUsername } = useParams();
  const { user: me } = useAuth();
  const [conversation, setConversation] = useState<ApiConversation | null | undefined>(undefined);
  const [messages, setMessages] = useState<ApiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const conversationIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!otherUsername) return;
    let cancelled = false;
    api<ApiConversation>(`/conversations/with/${otherUsername}`)
      .then((convo) => {
        if (cancelled) return;
        setConversation(convo);
        setMessages(convo.messages);
      })
      .catch(() => !cancelled && setConversation(null));
    return () => {
      cancelled = true;
    };
  }, [otherUsername]);

  useEffect(() => {
    if (!conversation) return;
    const socket = getSocket();
    conversationIdRef.current = conversation.id;
    socket.emit("joinConversation", conversation.id);
    const onNewMessage = (msg: ApiMessage) => {
      if (msg.conversationId === conversationIdRef.current) {
        setMessages((m) => (m.some((existing) => existing.id === msg.id) ? m : [...m, msg]));
      }
    };
    socket.on("newMessage", onNewMessage);
    return () => {
      socket.emit("leaveConversation", conversation.id);
      socket.off("newMessage", onNewMessage);
    };
  }, [conversation]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || !conversation) return;
    setSending(true);
    try {
      const message = await api<ApiMessage>(`/conversations/${conversation.id}/messages`, {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessages((m) => [...m, message]);
      setDraft("");
    } finally {
      setSending(false);
    }
  };

  if (conversation === undefined) {
    return (
      <AppShell>
        <p className="font-space text-xs uppercase tracking-widest text-ink/40">Loading…</p>
      </AppShell>
    );
  }

  if (!conversation) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl py-24 text-center">
          <p className="font-space text-sm font-bold uppercase">No such correspondent</p>
          <Link to="/messages" className="mt-4 inline-block font-space text-[11px] underline underline-offset-4">
            Back to correspondence
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto flex max-w-2xl flex-col" style={{ minHeight: "calc(100vh - 10rem)" }}>
        <header className="mb-6 flex items-center gap-4 border-b border-ink/10 pb-4">
          <Link to="/messages" className="font-space text-[10px] uppercase tracking-widest text-ink/40 hover:text-ink">
            ← Index
          </Link>
          <Link to={`/${conversation.otherUser.username}`} className="flex items-center gap-3 hover:opacity-70">
            <InkAvatar name={conversation.otherUser.username} size="sm" />
            <div>
              <p className="font-space text-xs font-bold">{conversation.otherUser.username}</p>
              <p className="text-[10px] text-ink/50">{conversation.otherUser.location}</p>
            </div>
          </Link>
        </header>

        <div className="flex-1 space-y-3">
          {messages.map((msg) => {
            const fromMe = msg.senderId === me?.id;
            return (
              <div
                key={msg.id}
                className={`max-w-[75%] px-3 py-2 text-sm leading-relaxed ${
                  fromMe ? "ml-auto bg-ink text-paper" : "mr-auto bg-surface text-ink"
                }`}
              >
                <p>{msg.message}</p>
                <p className={`mt-1 font-space text-[9px] uppercase tracking-widest ${fromMe ? "text-paper/50" : "text-ink/40"}`}>
                  {new Date(msg.createdAt).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            );
          })}
          {messages.length === 0 && (
            <p className="font-space text-xs text-ink/40">No dispatches yet. Say hello.</p>
          )}
        </div>

        <form onSubmit={handleSend} className="mt-8 flex gap-2 border-t border-ink/10 pt-4">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Write a dispatch…"
            className="flex-1 border border-ink/20 bg-transparent px-3 py-2 text-sm outline-none placeholder:text-ink/30 focus:border-ink"
          />
          <button
            type="submit"
            disabled={sending}
            className="bg-ink px-5 py-2 font-space text-[11px] font-bold uppercase tracking-widest text-paper transition-colors hover:bg-ink-muted disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </AppShell>
  );
}
