import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, requireUser } from "@/lib/api";
import { getScopedRequest } from "@/lib/requests";

export const GET = handle(async (_req, { params }) => {
  const user = await requireUser();
  const { id } = await params;
  const [file] = await db.select().from(schema.attachments).where(eq(schema.attachments.id, id));
  if (!file || !(await getScopedRequest(user, file.requestId))) {
    throw new ApiError(404, "File not found");
  }
  return new Response(Buffer.from(file.data, "base64"), {
    headers: {
      "Content-Type": file.mimeType,
      "Cache-Control": "private, max-age=3600",
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.fileName)}"`,
    },
  });
});
