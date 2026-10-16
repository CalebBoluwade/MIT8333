import { RequestList } from "@/components/requests/request-list";
import { StatCard } from "@/components/stat-card";
import { getSession } from "@/lib/auth";
import { statusCounts } from "@/lib/stats";
import { Hammer, Clock, Loader2, CheckCircle2 } from "lucide-react";

export const metadata = { title: "My jobs" };

export default async function OfficerHome() {
  const user = (await getSession())!;
  const c = await statusCounts(user);

  return (
    <div className="grid gap-8">
      <div>
        <p className="text-sm font-medium text-muted-foreground">Maintenance Officer</p>
        <h1 className="text-2xl font-bold tracking-tight">My jobs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Open a request to start work or mark it complete.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Assigned jobs" value={c.total} accent="indigo" icon={Hammer} />
        <StatCard label="To start" value={c.assigned} accent="amber" icon={Clock} />
        <StatCard label="In progress" value={c.in_progress} accent="sky" icon={Loader2} />
        <StatCard label="Completed" value={c.completed} accent="emerald" icon={CheckCircle2} />
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Available to pick up
        </h2>
        <RequestList
          mode="officer"
          initialStatus="pending"
          emptyHint="No unassigned requests right now."
        />
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          My active jobs
        </h2>
        <RequestList
          mode="officer"
          initialStatus="assigned"
          emptyHint="No jobs assigned to you yet. New assignments will appear here and in your notifications."
        />
      </div>
    </div>
  );
}
