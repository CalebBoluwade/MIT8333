"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import type { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginSchema, registerSchema } from "@/lib/validators";

type LoginValues = z.input<typeof loginSchema>;
type RegisterValues = z.input<typeof registerSchema>;
export function AuthForm({ mode }: Readonly<{ mode: "login" | "register" }>) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const registering = mode === "register";
  const form = useForm<LoginValues | RegisterValues>({
    resolver: zodResolver(registering ? registerSchema : loginSchema) as never,
    defaultValues: registering
      ? { name: "", email: "", password: "", role: "student" }
      : { email: "", password: "" },
  });
  async function onSubmit(values: LoginValues | RegisterValues) {
    setBusy(true);
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) {
        toast.error(result.error ?? "Unable to authenticate");
        return;
      }
      toast.success(
        registering ? "Account created successfully" : "Welcome back",
      );
      router.push("/dashboard");
      router.refresh();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  const errors = form.formState.errors as Record<
    string,
    { message?: string } | undefined
  >;
  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit(onSubmit as never)}
      noValidate
    >
      {registering && (
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Jane Smith"
            {...form.register("name" as never)}
          />
          {errors.name?.message && (
            <p className="text-xs text-red-600">{errors.name.message}</p>
          )}
        </div>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="email">University email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@university.edu"
          {...form.register("email" as never)}
        />
        {errors.email?.message && (
          <p className="text-xs text-red-600">{errors.email.message}</p>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete={registering ? "new-password" : "current-password"}
          placeholder="At least 8 characters"
          {...form.register("password" as never)}
        />
        {errors.password?.message && (
          <p className="text-xs text-red-600">{errors.password.message}</p>
        )}
      </div>
      {registering && (
        <div className="space-y-1.5">
          <Label htmlFor="role">Account type</Label>
          <select
            id="role"
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm"
            {...form.register("role" as never)}
          >
            <option value="student">Student</option>
            <option value="staff">Staff</option>
          </select>
          <p className="text-xs text-slate-500">
            Maintenance officer and administrator access must be provisioned by
            an administrator.
          </p>
        </div>
      )}
      <Button className="w-full" type="submit" disabled={busy}>
        {busy ? "Please wait…" : registering ? "Create account" : "Sign in"}
      </Button>
      <p className="text-center text-sm text-slate-500">
        {registering ? "Already have an account?" : "New to UniFix?"}{" "}
        <Link
          className="font-semibold text-blue-700 hover:underline"
          href={registering ? "/login" : "/register"}
        >
          {registering ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
