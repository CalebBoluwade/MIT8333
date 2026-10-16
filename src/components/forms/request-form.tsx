"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import { createRequestApiSchema } from "@/lib/validators";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Field } from "@/components/forms/field";

type FormIn = z.input<typeof createRequestApiSchema>;
type FormOut = z.output<typeof createRequestApiSchema>;
type Category = { id: number; name: string; description: string | null };

export function RequestForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [busy, setBusy] = useState(false);
  const form = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(createRequestApiSchema),
    defaultValues: { title: "", description: "", categoryId: 0, location: "", priority: "medium" as const },
  });
  const { formState: { errors } } = form;

  useEffect(() => {
    fetch("/api/categories")
      .then(async (r) => {
        const j = await r.json();
        if (r.ok) setCategories(j.data);
        else toast.error(j.error);
      })
      .catch(() => toast.error("Could not load categories"));
  }, []);

  async function submit(values: FormOut) {
    setBusy(true);
    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error ?? "Unable to submit request"); return; }
      toast.success(`Request ${data.reference} submitted`);
      router.push(`/requests/${data.id}`);
      router.refresh();
    } catch {
      toast.error("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const descLen = form.watch("description")?.length ?? 0;

  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-5" noValidate>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
          <Select id="categoryId" aria-invalid={!!errors.categoryId} {...form.register("categoryId")}>
            <option value="">Select a category</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="Priority" htmlFor="priority">
          <Select id="priority" {...form.register("priority")}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent — safety or major disruption</option>
          </Select>
        </Field>
      </div>

      <Field label="Building and room / location" htmlFor="location" error={errors.location?.message}>
        <Input id="location" placeholder="e.g. Science Block, Room 204" aria-invalid={!!errors.location} {...form.register("location")} />
      </Field>

      <Field label="Short title" htmlFor="title" error={errors.title?.message}>
        <Input id="title" placeholder="e.g. Projector not turning on" aria-invalid={!!errors.title} {...form.register("title")} />
      </Field>

      <Field label="Describe the issue" htmlFor="description" error={errors.description?.message}
        hint={!errors.description ? "Include useful details so the team can prepare." : undefined}>
        <Textarea
          id="description"
          rows={4}
          placeholder="Explain what is wrong, when you noticed it, and any details that may help the maintenance team."
          aria-invalid={!!errors.description}
          {...form.register("description")}
        />
        <p className="mt-1 text-right text-xs text-muted-foreground">{descLen}/4000</p>
      </Field>

      <div className="flex justify-end gap-3 border-t border-border pt-5">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" disabled={busy}>
          {busy ? <><Loader2 className="animate-spin" /> Submitting…</> : "Submit request"}
        </Button>
      </div>
    </form>
  );
}
