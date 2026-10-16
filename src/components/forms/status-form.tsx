"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
export function StatusForm({
  id,
  currentStatus,
  role,
}: {
  id: string;
  currentStatus: string;
  role: string;
}) {
  const [status, setStatus] = useState("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const allowed: Record<string, string[]> = {
    submitted: ["assigned", "rejected"],
    assigned: ["in_progress", "on_hold", "rejected"],
    in_progress: ["on_hold", "completed"],
    on_hold: ["in_progress", "rejected"],
    rejected: ["submitted"],
    completed: [],
  };
  const options =
    role === "admin"
      ? ["assigned", "in_progress", "on_hold", "completed", "rejected"]
      : (allowed[currentStatus] ?? []);
  async function update() {
    if (!status) {
      toast.error("Choose a new status");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/requests/${id}/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, comment }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Update failed");
        return;
      }
      toast.success("Request status updated");
      router.refresh();
      setStatus("");
      setComment("");
    } catch {
      toast.error("Network error");
    } finally {
      setBusy(false);
    }
  }
  if (!options.length)
    return (
      <p className="text-sm text-slate-500">
        No further status changes are available.
      </p>
    );
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="newStatus">New status</Label>
        <select
          id="newStatus"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
        >
          <option value="">Choose status</option>
          {options.map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="comment">Work note (optional)</Label>
        <Textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add an update for the requester…"
          className="min-h-20"
        />
      </div>
      <Button onClick={update} disabled={busy}>
        {busy ? "Updating…" : "Update status"}
      </Button>
    </div>
  );
}
