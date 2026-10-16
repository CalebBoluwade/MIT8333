"use client";

import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, UserPlus } from "lucide-react";
import type { z } from "zod";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Field } from "@/components/forms/field";
import { api, applyServerErrors, errorMessage, post } from "@/lib/client";
import { createUserSchema } from "@/lib/validators";
import { formatDate } from "@/lib/utils";
import type { RoleName } from "@/db/schema";

type U = { id: string; name: string; email: string; role: RoleName; isActive: boolean; createdAt: string };
type FormValues = z.infer<typeof createUserSchema>;
const ROLE_LABEL: Record<RoleName, string> = { student: "Student", staff: "Staff", officer: "Maintenance officer", admin: "Administrator" };

export function UsersManager({ currentUserId }: { currentUserId: string }) {
  const [users, setUsers] = useState<U[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const p = new URLSearchParams({ page: String(page) });
    if (q) p.set("q", q);
    if (role) p.set("role", role);
    setLoading(true);
    try {
      const r = await api<{ data: U[]; totalPages: number }>(`/api/users?${p}`);
      setUsers(r.data);
      setTotalPages(r.totalPages);
    } catch (e) {
      toast.error(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [page, q, role]);

  useEffect(() => {
    const t = setTimeout(load, 200);
    return () => clearTimeout(t);
  }, [load]);

  async function patch(u: U, body: { role?: RoleName; isActive?: boolean }, ok: string) {
    try {
      await api(`/api/users/${u.id}`, { method: "PATCH", body: JSON.stringify(body) });
      toast.success(ok);
      load();
    } catch (e) {
      toast.error(errorMessage(e));
    }
  }

  const { register, handleSubmit, reset, setError, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "officer" },
  });

  async function onCreate(values: FormValues) {
    try {
      await post("/api/users", values);
      toast.success(`${values.name} added`);
      reset({ role: "officer", name: "", email: "", password: "" });
      setShowForm(false);
      load();
    } catch (e) {
      applyServerErrors(e, setError);
      toast.error(errorMessage(e));
    }
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Administration</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">Users</h1>
          <p className="mt-1 text-sm text-muted-foreground">Add maintenance officers, change roles, or deactivate accounts.</p>
        </div>
        <Button onClick={() => setShowForm((s) => !s)}><UserPlus /> {showForm ? "Close" : "Add user"}</Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New user</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onCreate)} className="grid gap-4 sm:grid-cols-2" noValidate>
              <Field label="Full name" htmlFor="nu-name" error={errors.name?.message}><Input id="nu-name" aria-invalid={!!errors.name} {...register("name")} /></Field>
              <Field label="Email" htmlFor="nu-email" error={errors.email?.message}><Input id="nu-email" type="email" aria-invalid={!!errors.email} {...register("email")} /></Field>
              <Field label="Temporary password" htmlFor="nu-pass" error={errors.password?.message}><Input id="nu-pass" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} /></Field>
              <Field label="Role" htmlFor="nu-role" error={errors.role?.message}>
                <Select id="nu-role" {...register("role")}>
                  {(Object.keys(ROLE_LABEL) as RoleName[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                </Select>
              </Field>
              <div className="sm:col-span-2"><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="animate-spin" />} Create user</Button></div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <div className="flex flex-wrap gap-2 border-b border-border p-4">
          <Input aria-label="Search users" placeholder="Search name or email" className="max-w-xs" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
          <Select aria-label="Filter by role" className="w-48" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
            <option value="">All roles</option>
            {(Object.keys(ROLE_LABEL) as RoleName[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </Select>
        </div>
        <Table>
          <TableHeader><TableRow className="hover:bg-transparent"><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Joined</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {loading && users.length === 0 && Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i} className="hover:bg-transparent">
                {Array.from({ length: 5 }).map((__, j) => (
                  <TableCell key={j}><span className="skeleton block h-4 rounded" style={{ opacity: 1 - i * 0.15 }} /></TableCell>
                ))}
              </TableRow>
            ))}
            {users.map((u) => {
              const self = u.id === currentUserId;
              return (
                <TableRow key={u.id}>
                  <TableCell><span className="font-medium">{u.name}</span><span className="block text-xs text-muted-foreground">{u.email}</span></TableCell>
                  <TableCell>
                    <Select aria-label={`Role for ${u.name}`} className="h-8 w-44 text-xs" value={u.role} disabled={self} onChange={(e) => patch(u, { role: e.target.value as RoleName }, `${u.name} is now ${ROLE_LABEL[e.target.value as RoleName]}`)}>
                      {(Object.keys(ROLE_LABEL) as RoleName[]).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
                    </Select>
                  </TableCell>
                  <TableCell>{u.isActive ? <Badge tone="green">Active</Badge> : <Badge tone="neutral">Deactivated</Badge>}</TableCell>
                  <TableCell className="num text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" disabled={self} onClick={() => patch(u, { isActive: !u.isActive }, u.isActive ? `${u.name} deactivated` : `${u.name} reactivated`)}>
                      {u.isActive ? "Deactivate" : "Reactivate"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {!loading && users.length === 0 && <TableRow className="hover:bg-transparent"><TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No users match.</TableCell></TableRow>}
          </TableBody>
        </Table>
        <div className="flex items-center justify-end gap-2 border-t border-border px-4 py-3 text-sm">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
          <span className="num text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
        </div>
      </Card>
    </div>
  );
}
