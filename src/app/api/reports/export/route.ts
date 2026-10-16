import { handle, requireUser } from "@/lib/api";
import { queryRequests } from "@/lib/requests";
import { STATUS_LABELS } from "@/lib/status";
import { listQuerySchema } from "@/lib/validators";

/** Neutralise spreadsheet formulas in user-entered text (CSV injection). */
function cell(value: unknown) {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}

export const GET = handle(async (req) => {
  const user = await requireUser("admin");
  const raw = Object.fromEntries(new URL(req.url).searchParams);
  for (const k of Object.keys(raw)) if (raw[k] === "") delete raw[k];
  const filters = listQuerySchema.parse(raw);

  const { rows } = await queryRequests(user, filters, { limit: 5000, offset: 0 });
  const header = ["ID", "Title", "Category", "Location", "Priority", "Status", "Requested by", "Assigned to", "Created", "Completed"];
  const lines = rows.map((r) =>
    [
      r.id,
      r.title,
      r.categoryName,
      r.location,
      r.priority,
      STATUS_LABELS[r.status],
      r.requesterName,
      r.officerName ?? "",
      r.createdAt.toISOString(),
      r.completedAt?.toISOString() ?? "",
    ]
      .map(cell)
      .join(",")
  );

  return new Response([header.map(cell).join(","), ...lines].join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="service-requests-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
});
