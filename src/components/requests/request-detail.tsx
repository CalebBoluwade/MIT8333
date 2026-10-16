"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PriorityBadge, StatusBadge, StatusRail } from "@/components/status";
import { api, errorMessage, post } from "@/lib/client";
import { STATUS_LABELS, allowedTransitions, isClosed } from "@/lib/status";
import { formatDateTime } from "@/lib/utils";
import type { Priority, RequestStatus, RoleName } from "@/db/schema";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validators";

type Detail = {
  id: number;
  title: string;
  description: string;
  location: string;
  priority: Priority;
  status: RequestStatus;
  categoryName: string;
  requesterName: string;
  officerId: string | null;
  officerName: string | null;
  createdAt: string;
  completedAt: string | null;
  logs: { id: number; fromStatus: RequestStatus | null; toStatus: RequestStatus; note: string | null; changedByName: string; createdAt: string }[];
  attachments: { id: string; fileName: string }[];
};

export function RequestDetail({ id, role, viewerId }: Readonly<{ id: number; role: RoleName; viewerId: string }>) {
  const router = useRouter();
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [officers, setOfficers] = useState<{ id: string; name: string }[]>([]);
  const [officerId, setOfficerId] = useState("");

  const load = useCallback(async () => {
    try {
      setData(await api<Detail>(`/api/requests/${id}`));
    } catch (e) {
      setError(errorMessage(e));
    }
  }, [id]);

  useEffect(() => {
    void load();
    // Re-check periodically so the tracking page reflects changes made by others.
    const t = setInterval(() => void load(), 20000);
    return () => clearInterval(t);
  }, [load]);

  useEffect(() => {
    if (role === "admin") api<{ data: { id: string; name: string }[] }>("/api/officers").then((r) => setOfficers(r.data)).catch(() => {});
  }, [role]);

  async function run(fn: () => Promise<unknown>, success: string) {
    setBusy(true);
    try {
      await fn();
      toast.success(success);
      setNote("");
      await load();
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  const setStatus = (status: RequestStatus, success: string) =>
    run(() => post(`/api/requests/${id}/status`, { status, note: note || undefined }), success);

  async function upload(file?: File) {
    if (!file) return;
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) return toast.error("Only JPG, PNG or WebP images are allowed");
    if (file.size > MAX_UPLOAD_BYTES) return toast.error("Image is over 1 MB. Choose a smaller photo.");
    const body = new FormData();
    body.append("file", file);
    run(() => api(`/api/requests/${id}/attachments`, { method: "POST", body }), "Photo added");
  }

  async function remove() {
    if (!confirm(`Delete request #${id}? This can't be undone.`)) return;
    setBusy(true);
    try {
      await api(`/api/requests/${id}`, { method: "DELETE" });
      toast.success(`Request #${id} deleted`);
      router.replace("/admin/requests");
    } catch (e) {
      toast.error(errorMessage(e));
      setBusy(false);
    }
  }

  if (error) {
    return (
      <Card><CardContent className="py-16 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-red-50 mx-auto mb-3">
          <span className="text-2xl">⚠️</span>
        </span>
        <p className="font-semibold">{error}</p>
        <p className="mt-1 text-sm text-muted-foreground">It may not exist, or it isn&apos;t one you can see.</p>
      </CardContent></Card>
    );
  }
  if (!data) return (
    <div className="grid gap-6">
      <div className="h-8 w-64 skeleton rounded" />
      <div className="h-24 skeleton rounded-xl" />
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <div className="h-48 skeleton rounded-xl" />
          <div className="h-64 skeleton rounded-xl" />
        </div>
        <div className="h-48 skeleton rounded-xl" />
      </div>
    </div>
  );

  const next = allowedTransitions(role, data.status);
  const canPickUp = role === "officer" && data.status === "pending" && !data.officerId;
  const canStart = next.includes("in_progress") && (role !== "officer" || data.officerId === viewerId);
  const canComplete = next.includes("completed");
  const canReject = next.includes("rejected");
  const canCancel = next.includes("cancelled");
  const canUpload = role !== "officer" && !isClosed(data.status) && data.attachments.length < 3;

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="num text-sm text-muted-foreground">Request #{data.id}</p>
          <h1 className="text-2xl font-semibold">{data.title}</h1>
        </div>
        <div className="flex gap-2">
          <PriorityBadge priority={data.priority} />
          <StatusBadge status={data.status} />
        </div>
      </div>

      <Card><CardContent className="py-6"><StatusRail status={data.status} /></CardContent></Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="grid gap-6">
          <Card>
            <CardHeader><CardTitle>Details</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              <p className="whitespace-pre-wrap text-sm">{data.description}</p>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div><dt className="text-muted-foreground">Location</dt><dd>{data.location}</dd></div>
                <div><dt className="text-muted-foreground">Category</dt><dd>{data.categoryName}</dd></div>
                <div><dt className="text-muted-foreground">Requested by</dt><dd>{data.requesterName}</dd></div>
                <div><dt className="text-muted-foreground">Assigned to</dt><dd>{data.officerName ?? "Not assigned yet"}</dd></div>
                <div><dt className="text-muted-foreground">Submitted</dt><dd>{formatDateTime(data.createdAt)}</dd></div>
                {data.completedAt && <div><dt className="text-muted-foreground">Completed</dt><dd>{formatDateTime(data.completedAt)}</dd></div>}
              </dl>
              {(data.attachments.length > 0 || canUpload) && (
                <div className="flex flex-wrap gap-3">
                  {data.attachments.map((a) => (
                    <a key={a.id} href={`/api/attachments/${a.id}`} target="_blank" rel="noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={`/api/attachments/${a.id}`} alt={a.fileName} className="size-28 rounded-md border border-border object-cover" />
                    </a>
                  ))}
                  {canUpload && (
                    <label className="flex size-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
                      <ImagePlus className="size-5" aria-hidden /> Add photo
                      <input type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} className="sr-only" onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ""; }} />
                    </label>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Request timeline</CardTitle></CardHeader>
            <CardContent>
              <ol className="grid" aria-label="Request timeline">
                {[...data.logs].reverse().map((l, index) => (
                  <li key={l.id} className="relative grid grid-cols-[1rem_minmax(0,1fr)] gap-x-3 pb-5 last:pb-0">
                    {index < data.logs.length - 1 && (
                      <span aria-hidden className="absolute bottom-0 left-[7px] top-3 w-px bg-border" />
                    )}
                    <span
                      aria-hidden
                      className={`relative z-10 mt-1 size-3 rounded-full border-2 ${index === 0 ? "border-primary bg-primary" : "border-muted-foreground/40 bg-card"}`}
                    />
                    <div className="grid gap-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <p className="text-sm font-medium">
                          {l.fromStatus === null
                            ? "Request submitted"
                            : l.fromStatus === l.toStatus
                              ? "Assignment updated"
                              : `${STATUS_LABELS[l.fromStatus]} to ${STATUS_LABELS[l.toStatus]}`}
                        </p>
                        <time className="text-xs text-muted-foreground" dateTime={l.createdAt}>
                          {formatDateTime(l.createdAt)}
                        </time>
                      </div>
                      <p className="text-xs text-muted-foreground">{l.changedByName}</p>
                      {l.note && <p className="text-sm">{l.note}</p>}
                    </div>
                  </li>
                ))}
                {data.logs.length === 0 && (
                  <li className="text-sm text-muted-foreground">No timeline updates yet.</li>
                )}
              </ol>
            </CardContent>
          </Card>
        </div>

        {(next.length > 0 || canPickUp || role === "admin") && (
          <Card className="h-fit">
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent className="grid gap-4">
              {role === "admin" && !isClosed(data.status) && (
                <div className="grid gap-2">
                  <label htmlFor="officer" className="text-sm font-medium">{data.officerId ? "Reassign to" : "Assign to"}</label>
                  <Select id="officer" value={officerId} onChange={(e) => setOfficerId(e.target.value)}>
                    <option value="">Choose an officer</option>
                    {officers.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                  </Select>
                  <Button disabled={!officerId || busy} onClick={() => run(() => post(`/api/requests/${id}/assign`, { officerId, note: note || undefined }), "Officer assigned")}>
                    {busy && <Loader2 className="animate-spin" />} {data.officerId ? "Reassign" : "Assign officer"}
                  </Button>
                </div>
              )}

              {canPickUp && (
                <Button disabled={busy} onClick={() => run(() => post(`/api/requests/${id}/pickup`, {}), "Request picked up")}>
                  {busy && <Loader2 className="animate-spin" />} Pick up request
                </Button>
              )}

              {next.length > 0 && (
                <div className="grid gap-2">
                  <label htmlFor="note" className="text-sm font-medium">Note {canReject && <span className="font-normal text-muted-foreground">(required to reject)</span>}</label>
                  <Textarea id="note" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add an update for the record" />
                  {canStart && <Button disabled={busy} onClick={() => setStatus("in_progress", "Work started")}>Start work</Button>}
                  {canComplete && <Button disabled={busy} onClick={() => setStatus("completed", "Marked as completed")}>Mark as completed</Button>}
                  {canReject && <Button variant="outline" disabled={busy || !note.trim()} onClick={() => setStatus("rejected", "Request rejected")}>Reject request</Button>}
                  {canCancel && <Button variant="outline" disabled={busy} onClick={() => confirm("Cancel this request?") && setStatus("cancelled", "Request cancelled")}>Cancel request</Button>}
                </div>
              )}

              {role === "admin" && (
                <Button variant="ghost" className="text-destructive hover:bg-red-50" disabled={busy} onClick={remove}>Delete request</Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
