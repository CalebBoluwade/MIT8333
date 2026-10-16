import Link from "next/link";
import { redirect } from "next/navigation";
import { ClipboardList, Clock, PlusCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestList } from "@/components/requests/request-list";
import { StatCard } from "@/components/stat-card";
import { getSession, homePathFor } from "@/lib/auth";
import { statusCounts } from "@/lib/stats";

export const metadata = { title: "Overview" };

export default async function StudentDashboard() {
  const user = (await getSession())!;
  if (user.role !== "student" && user.role !== "staff") redirect(homePathFor(user.role));
  const c = await statusCounts(user);

  return (
    <div className="grid gap-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Welcome back</p>
          <h1 className="text-2xl font-bold tracking-tight">
            {user.name.split(" ")[0]} 👋
          </h1>
        </div>
        <Button asChild>
          <Link href="/requests/new">
            <PlusCircle /> New request
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Total submitted" value={c.total} accent="indigo" icon={ClipboardList} />
        <StatCard label="Awaiting assignment" value={c.pending} accent="amber" icon={Clock} />
        <StatCard label="Being worked on" value={c.assigned + c.in_progress} accent="sky" icon={Clock} />
        <StatCard label="Completed" value={c.completed} accent="emerald" icon={CheckCircle2} />
      </div>

      <div>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Your requests
        </h2>
        <RequestList
          mode="student"
          emptyHint="You have not reported anything yet. Use New Request when something needs fixing."
        />
      </div>
    </div>
  );
}
