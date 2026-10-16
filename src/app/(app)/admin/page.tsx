import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RequestList } from "@/components/requests/request-list";
import { StatCard } from "@/components/stat-card";
import { getSession } from "@/lib/auth";
import { adminSummary, statusCounts } from "@/lib/stats";
import { ClipboardList, Clock, CheckCircle2, Timer, BarChart3 } from "lucide-react";

export const metadata = { title: "Admin overview" };

export default async function AdminHome() {
  const user = (await getSession())!;
  const [c, s] = await Promise.all([statusCounts(user), adminSummary()]);
  const max = Math.max(1, ...s.byCategory.map((x) => x.n));

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Administration</p>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/requests">All requests</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatCard label="All requests" value={c.total} accent="indigo" icon={ClipboardList} />
        <StatCard label="Need assignment" value={c.pending} accent="amber" icon={Clock} />
        <StatCard label="In progress" value={c.assigned + c.in_progress} accent="sky" icon={Timer} />
        <StatCard label="Completed" value={c.completed} accent="emerald" icon={CheckCircle2} />
        <StatCard
          label="Avg. time to complete"
          value={s.avgHours === null ? "–" : `${s.avgHours}h`}
          accent="violet"
          icon={BarChart3}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem]">
        <div>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Waiting for assignment
          </h2>
          <RequestList mode="admin" initialStatus="pending" emptyHint="Everything has been assigned." />
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Requests by category</CardTitle>
          </CardHeader>
          <CardContent>
            {s.byCategory.length === 0 && (
              <p className="text-sm text-muted-foreground">No data yet.</p>
            )}
            <ul className="grid gap-4">
              {s.byCategory.map((x) => (
                <li key={x.category}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{x.category}</span>
                    <span className="num text-muted-foreground">{x.n}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                      style={{ width: `${(x.n / max) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
