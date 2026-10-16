"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Download, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriorityBadge, StatusBadge } from "@/components/status";
import { api, errorMessage } from "@/lib/client";
import { PRIORITIES, STATUSES, type Priority, type RequestStatus } from "@/db/schema";
import { PRIORITY_LABELS, STATUS_LABELS } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";

type Row = {
  id: number;
  title: string;
  location: string;
  priority: Priority;
  status: RequestStatus;
  categoryName: string;
  requesterName: string;
  officerName: string | null;
  createdAt: string;
};
type Category = { id: number; name: string };

export function RequestList({
  mode,
  emptyHint,
  initialStatus = "",
}: {
  mode: "student" | "officer" | "admin";
  emptyHint?: string;
  initialStatus?: RequestStatus | "";
}) {
  const [rows, setRows] = useState<Row[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<string>(initialStatus);
  const [priority, setPriority] = useState("");
  const [categoryId, setCategoryId] = useState("");

  // Debounce the search box so we don't query on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    api<{ data: Category[] }>("/api/categories").then((r) => setCategories(r.data)).catch(() => {});
  }, []);

  const params = useCallback(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (priority) p.set("priority", priority);
    if (categoryId) p.set("categoryId", categoryId);
    return p;
  }, [q, status, priority, categoryId]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const p = params();
    p.set("page", String(page));
    p.set("pageSize", "10");
    api<{ data: Row[]; totalPages: number; total: number }>(`/api/requests?${p}`)
      .then((r) => {
        if (cancelled) return;
        setRows(r.data);
        setTotalPages(r.totalPages);
        setTotal(r.total);
      })
      .catch((e) => !cancelled && toast.error(errorMessage(e)))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [params, page]);

  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(1);
  };

  return (
    <Card>
      <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
        <div className="relative min-w-48 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            aria-label="Search requests"
            placeholder="Search title, location or request number"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select aria-label="Filter by status" className="w-36" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABELS[s]}</option>
          ))}
        </Select>
        <Select aria-label="Filter by priority" className="w-36" value={priority} onChange={(e) => resetPage(setPriority)(e.target.value)}>
          <option value="">All priorities</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
          ))}
        </Select>
        <Select aria-label="Filter by category" className="w-44" value={categoryId} onChange={(e) => resetPage(setCategoryId)(e.target.value)}>
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        {mode === "admin" && (
          <Button asChild variant="outline">
            <a href={`/api/reports/export?${params()}`}>
              <Download /> Export CSV
            </a>
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="w-16">No.</TableHead>
            <TableHead>Request</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Status</TableHead>
            {mode !== "student" && <TableHead>Requested by</TableHead>}
            {mode === "admin" && <TableHead>Assigned to</TableHead>}
            <TableHead>Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody aria-busy={loading}>
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="num text-muted-foreground">#{r.id}</TableCell>
              <TableCell>
                <Link href={`/requests/${r.id}`} className="font-medium hover:text-primary hover:underline">
                  {r.title}
                </Link>
                <span className="block text-xs text-muted-foreground">{r.location}</span>
              </TableCell>
              <TableCell>{r.categoryName}</TableCell>
              <TableCell><PriorityBadge priority={r.priority} /></TableCell>
              <TableCell><StatusBadge status={r.status} /></TableCell>
              {mode !== "student" && <TableCell>{r.requesterName}</TableCell>}
              {mode === "admin" && (
                <TableCell className={r.officerName ? "" : "text-muted-foreground"}>{r.officerName ?? "Unassigned"}</TableCell>
              )}
              <TableCell className="num whitespace-nowrap text-muted-foreground">{formatDate(r.createdAt)}</TableCell>
            </TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={8} className="py-14 text-center">
                <div className="flex flex-col items-center gap-2">
                  <span className="flex size-10 items-center justify-center rounded-full bg-muted">
                    <Search className="size-5 text-muted-foreground/50" aria-hidden />
                  </span>
                  <p className="text-sm font-medium text-muted-foreground">
                    {q || status || priority || categoryId
                      ? "No requests match these filters."
                      : (emptyHint ?? "No requests yet.")}
                  </p>
                  {(q || status || priority || categoryId) && (
                    <button
                      onClick={() => { setSearch(""); setQ(""); setStatus(initialStatus); setPriority(""); setCategoryId(""); }}
                      className="text-xs text-primary underline-offset-2 hover:underline"
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          )}
          {loading && rows.length === 0 && (
            Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: mode === "admin" ? 8 : mode === "officer" ? 7 : 6 }).map((__, j) => (
                  <TableCell key={j}>
                    <span className="skeleton block h-4 w-full rounded" style={{ opacity: 1 - i * 0.15 }} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm">
        <span className="num text-muted-foreground">
          {total} {total === 1 ? "request" : "requests"}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft /> Previous
          </Button>
          <span className="num text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next <ChevronRight />
          </Button>
        </div>
      </div>
    </Card>
  );
}
