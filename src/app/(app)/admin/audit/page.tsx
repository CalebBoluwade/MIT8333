import { AuditTable } from "@/components/admin/audit-table";

export const metadata = { title: "Activity log" };

export default function AuditPage() {
  return (
    <div className="grid gap-6">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Administration</p>
        <h1 className="text-2xl font-semibold">Activity log</h1>
        <p className="mt-1 text-sm text-muted-foreground">Sign-ins, assignments, status changes and account changes, newest first.</p>
      </div>
      <AuditTable />
    </div>
  );
}
