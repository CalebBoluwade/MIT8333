"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/forms/field";
import { PasswordInput } from "@/components/forms/password-input";
import { loginSchema, type LoginInput } from "@/lib/validators";
import { applyServerErrors, errorMessage, post } from "@/lib/client";
import { homePathFor } from "@/lib/auth-utils";

export function LoginForm() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    try {
      const { user } = await post("/api/auth/login", values);
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      router.replace(next && next.startsWith("/") ? next : homePathFor(user.role));
      router.refresh();
    } catch (e) {
      applyServerErrors(e, setError);
      toast.error(errorMessage(e));
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
      <Field label="Email" htmlFor="email" error={errors.email?.message}>
        <Input id="email" type="email" autoComplete="email" autoFocus aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label="Password" htmlFor="password" error={errors.password?.message}>
        <PasswordInput id="password" autoComplete="current-password" aria-invalid={!!errors.password} {...register("password")} />
      </Field>
      <Button type="submit" disabled={isSubmitting} className="w-full">
        {isSubmitting ? <><Loader2 className="animate-spin" /> Signing in…</> : "Sign in"}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
