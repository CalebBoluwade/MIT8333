import { RegisterForm } from "@/components/forms/register-form";

export default function RegisterPage() {
  return (
    <>
      <h1 className="text-2xl font-bold tracking-tight">Create your account</h1>
      <p className="mb-7 mt-1.5 text-sm text-muted-foreground">
        For students and staff. Officers are added by an administrator.
      </p>
      <RegisterForm />
    </>
  );
}
