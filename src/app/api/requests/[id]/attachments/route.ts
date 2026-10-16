import { randomUUID } from "node:crypto";
import { count, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { ApiError, handle, parseId, requireUser } from "@/lib/api";
import { audit } from "@/lib/audit";
import { getScopedRequest } from "@/lib/requests";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES } from "@/lib/validators";

const MAX_FILES = 3;

export const POST = handle(async (req, { params }) => {
  const user = await requireUser();
  const id = parseId((await params).id);
  const request = await getScopedRequest(user, id);
  if (!request) throw new ApiError(404, "Request not found");
  if (user.role === "officer") throw new ApiError(403, "You do not have permission to do that");

  const form = await req.formData();
  const file = form.get("file");
  if (!file || typeof (file as File).arrayBuffer !== "function" || typeof (file as File).type !== "string") throw new ApiError(400, "Attach an image file");
  const f = file as File;
  if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
    throw new ApiError(400, "Only JPG, PNG or WebP images are allowed");
  }
  if (f.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(400, "Image is too large. Keep it under 1 MB");
  }

  const [{ n }] = await db
    .select({ n: count() })
    .from(schema.attachments)
    .where(eq(schema.attachments.requestId, id));
  if (n >= MAX_FILES) throw new ApiError(409, `You can attach up to ${MAX_FILES} images`);

  const attachmentId = randomUUID();
  await db.insert(schema.attachments).values({
    id: attachmentId,
    requestId: id,
    fileName: f.name.slice(0, 120),
    mimeType: f.type,
    size: f.size,
    data: Buffer.from(await f.arrayBuffer()).toString("base64"),
    uploadedById: user.id,
  });
  await audit(user.id, "attachment.upload", "request", id, { attachmentId });
  return Response.json({ id: attachmentId }, { status: 201 });
});
