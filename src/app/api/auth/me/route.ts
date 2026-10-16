import { handle, requireUser } from "@/lib/api";

export const GET = handle(async () => ({ user: await requireUser() }));
