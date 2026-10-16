"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { api, post } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";

type Note = { id: number; message: string; requestId: number | null; readAt: string | null; createdAt: string };

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [unread, setUnread] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const res = await api<{ data: Note[]; unread: number }>("/api/notifications");
      setNotes(res.data);
      setUnread(res.unread);
    } catch { /* stay quiet */ }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) {
      await post("/api/notifications");
      setUnread(0);
    }
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={toggle}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Bell className="size-4" aria-hidden />
        {unread > 0 && (
          <span
            style={{ background: "#4f46e5" }}
            className="num absolute right-1 top-1 flex min-w-[1rem] items-center justify-center rounded-full px-1 text-[9px] font-bold leading-4 text-white"
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-border bg-card shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold">Notifications</p>
            {notes.length > 0 && unread === 0 && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">All read</span>
            )}
            {unread > 0 && (
              <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{unread} new</span>
            )}
          </div>
          <ul className="max-h-80 divide-y divide-border overflow-y-auto">
            {notes.length === 0 && (
              <li className="flex flex-col items-center gap-2 px-4 py-10 text-center">
                <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                  <Bell className="size-5 text-muted-foreground/40" aria-hidden />
                </span>
                <p className="text-sm font-medium text-muted-foreground">No notifications yet</p>
                <p className="text-xs text-muted-foreground/60">You&apos;ll see updates here when requests change.</p>
              </li>
            )}
            {notes.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.requestId ? `/requests/${n.requestId}` : "#"}
                  onClick={() => setOpen(false)}
                  className="flex gap-3 px-4 py-3 text-sm transition-colors hover:bg-muted/50"
                >
                  <span
                    style={{ background: n.readAt ? "transparent" : "#4f46e5" }}
                    className="mt-1.5 size-1.5 shrink-0 rounded-full"
                  />
                  <span className="min-w-0">
                    <span className={n.readAt ? "text-muted-foreground" : "font-medium"}>
                      {n.message}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">
                      {formatDateTime(n.createdAt)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
