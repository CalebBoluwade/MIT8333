"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/forms/field";
import { api, applyServerErrors, errorMessage, post } from "@/lib/client";
import { ALLOWED_IMAGE_TYPES, MAX_UPLOAD_BYTES, createRequestApiSchema } from "@/lib/validators";
import { PRIORITIES } from "@/db/schema";
import { PRIORITY_LABELS } from "@/lib/status";

type FormIn = z.input<typeof createRequestApiSchema>;
type FormOut = z.output<typeof createRequestApiSchema>;

export function RequestForm() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: number; name: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({
    resolver: zodResolver(createRequestApiSchema),
    defaultValues: { priority: "medium" },
  });

  useEffect(() => {
    api<{ data: { id: number; name: string }[] }>("/api/categories")
      .then((r) => setCategories(r.data))
      .catch((e) => toast.error(errorMessage(e)));
  }, []);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const f of Array.from(list)) {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        toast.error(`${f.name}: only JPG, PNG or WebP images are allowed`);
      } else if (f.size > MAX_UPLOAD_BYTES) {
        toast.error(`${f.name} is over 1 MB. Choose a smaller photo.`);
      } else if (next.length >= 3) {
        toast.error("You can attach up to 3 images");
        break;
      } else {
        next.push(f);
      }
    }
    setFiles(next);
  }

  async function onSubmit(values: FormOut) {
    try {
      const created = await post<{ id: number }>("/api/requests", values);
      let failed = 0;
      for (const file of files) {
        const body = new FormData();
        body.append("file", file);
        try {
          await api(`/api/requests/${created.id}/attachments`, { method: "POST", body });
        } catch {
          failed++;
        }
      }
      if (failed) toast.warning(`Request submitted, but ${failed} image(s) didn't upload. You can add them from the request page.`);
      else toast.success(`Request #${created.id} submitted`);
      router.push(`/requests/${created.id}`);
    } catch (e) {
      applyServerErrors(e, setError);
      toast.error(errorMessage(e));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5" noValidate>
      <Field label="What's wrong?" htmlFor="title" error={errors.title?.message} hint="A short summary, e.g. “Ceiling light out in Lab 3”">
        <Input id="title" aria-invalid={!!errors.title} {...register("title")} />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Category" htmlFor="categoryId" error={errors.categoryId?.message}>
          <Select id="categoryId" defaultValue="" aria-invalid={!!errors.categoryId} {...register("categoryId")}>
            <option value="" disabled>Choose a category</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </Field>
        <Field label="How urgent is it?" htmlFor="priority" error={errors.priority?.message}>
          <Select id="priority" {...register("priority")}>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </Select>
        </Field>
      </div>
      <Field label="Where is it?" htmlFor="location" error={errors.location?.message} hint="Building, floor and room or hostel block">
        <Input id="location" aria-invalid={!!errors.location} {...register("location")} />
      </Field>
      <Field label="Details" htmlFor="description" error={errors.description?.message} hint="What happened, and since when?">
        <Textarea id="description" rows={5} aria-invalid={!!errors.description} {...register("description")} />
      </Field>

      <div className="grid gap-2">
        <span className="text-sm font-medium">Photos <span className="font-normal text-muted-foreground">(optional, up to 3 images, 1 MB each)</span></span>
        <div className="flex flex-wrap items-center gap-3">
          {files.map((f, i) => (
            <div key={i} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={URL.createObjectURL(f)} alt={f.name} className="size-20 rounded-md border border-border object-cover" />
              <button
                type="button"
                aria-label={`Remove ${f.name}`}
                onClick={() => setFiles(files.filter((_, j) => j !== i))}
                className="absolute -right-2 -top-2 rounded-full bg-foreground p-0.5 text-background"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ))}
          {files.length < 3 && (
            <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-input text-xs text-muted-foreground hover:bg-accent focus-within:ring-2 focus-within:ring-ring">
              <ImagePlus className="size-5" aria-hidden />
              Add photo
              <input type="file" accept={ALLOWED_IMAGE_TYPES.join(",")} multiple className="sr-only" onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }} />
            </label>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="animate-spin" />}
          Submit request
        </Button>
        <Button type="button" variant="ghost" onClick={() => router.back()}>Cancel</Button>
      </div>
    </form>
  );
}
