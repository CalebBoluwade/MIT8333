"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { api, errorMessage } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";

type Log = { id: number; action: string; entity: string; entityId: string | null; meta: string | null; actorName: string | null; createdAt: string };

export function AuditTable() {
  const [rows, setRows] = useState<Log[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    api<{ data: Log[]; totalPages: number }>(`/api/audit-logs?page=${page}`)
      .then((r) => { setRows(r.data); setTotalPages(r.totalPages); })
      .catch((e) => toast.error(errorMessage(e)))
      .finally(() => setLoading(false));
  }, [page]);

  return (
    <Card>
      <Table>
        <TableHeader><TableRow className="hover:bg-transparent"><TableHead>When</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Details</TableHead></TableRow></TableHeader>
        <TableBody>
          {loading && rows.length === 0 && Array.from({ length: 6 }).map((_, i) => (
            <TableRow key={i} className="hover:bg-transparent">
              {Array.from({ length: 5 }).map((__, j) => (
                <TableCell key={j}><span className="skeleton block h-4 rounded" style={{ opacity: 1 - i * 0.12 }} /></TableCell>
              ))}
            </TableRow>
          ))}
          {rows.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="num whitespace-nowrap text-muted-foreground">{formatDateTime(r.createdAt)}</TableCell>
              <TableCell>{r.actorName ?? "System"}</TableCell>
              <TableCell className="font-medium">{r.action}</TableCell>
              <TableCell className="num">{r.entity}{r.entityId ? ` ${r.entityId.length > 8 ? r.entityId.slice(0, 8) + "…" : "#" + r.entityId}` : ""}</TableCell>
              <TableCell className="max-w-64 truncate text-xs text-muted-foreground">{r.meta}</TableCell>
            </TableRow>
          ))}
          {!loading && rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No activity recorded yet.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3 text-sm">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <span className="num text-muted-foreground">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </Card>
  );
}
