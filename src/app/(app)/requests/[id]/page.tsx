import { notFound } from "next/navigation";
import { RequestDetail } from "@/components/requests/request-detail";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Request" };

export default async function RequestPage({ params }: { params: Promise<{ id: string }> }) {
  const user = (await getSession())!;
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();
  return <RequestDetail id={id} role={user.role} viewerId={user.id} />;
}
