import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RequestList } from "@/components/requests/request-list";
import { getSession } from "@/lib/auth";

export const metadata = { title: "My requests" };

export default async function MyRequests() {
  const user = (await getSession())!;
  const mode = user.role === "admin" ? "admin" : user.role === "officer" ? "officer" : "student";
  const isStudent = user.role === "student" || user.role === "staff";

  return (
    <div className="grid gap-8">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {isStudent ? "Student" : "Requests"}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">
            {isStudent ? "My requests" : "Requests"}
          </h1>
        </div>
        {isStudent && (
          <Button asChild>
            <Link href="/requests/new"><PlusCircle /> New request</Link>
          </Button>
        )}
      </div>
      <RequestList mode={mode} emptyHint="Nothing here yet." />
    </div>
  );
}
