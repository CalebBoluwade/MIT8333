import { Suspense } from "react";
import { LoginForm } from "@/components/forms/login-form";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">
        Sign in with your university account.
      </p>
      <Suspense>
        <LoginForm />
      </Suspense>
    </>
  );
}
