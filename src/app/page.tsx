import { redirect } from "next/navigation";
import { getSession, homePathFor } from "@/lib/auth";

export default async function Home() {
  const user = await getSession();
  redirect(user ? homePathFor(user.role) : "/login");
}
