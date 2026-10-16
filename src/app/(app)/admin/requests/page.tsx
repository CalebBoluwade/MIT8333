import { RequestList } from "@/components/requests/request-list";

export const metadata = { title: "All requests" };

export default function AdminRequests() {
  return (
    <div className="grid gap-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Administration</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">Requests</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a request to assign an officer, reject it, or review its history.
        </p>
      </div>
      <RequestList mode="admin" />
    </div>
  );
}
