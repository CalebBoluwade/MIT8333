import { UsersManager } from "@/components/admin/users-manager";
import { getSession } from "@/lib/auth";

export const metadata = { title: "Users" };

export default async function AdminUsers() {
  const user = (await getSession())!;
  return <UsersManager currentUserId={user.id} />;
}
