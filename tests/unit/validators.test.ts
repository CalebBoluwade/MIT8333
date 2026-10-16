import { describe, expect, it } from "vitest";
import { createRequestApiSchema, loginSchema, passwordSchema, registerSchema } from "@/lib/validators";

describe("validators", () => {
  it("normalises email casing and whitespace", () => {
    expect(loginSchema.parse({ email: "  Tola@Test.EDU ", password: "x" }).email).toBe("tola@test.edu");
  });

  it("enforces password rules", () => {
    expect(passwordSchema.safeParse("short1").success).toBe(false);
    expect(passwordSchema.safeParse("allletters").success).toBe(false);
    expect(passwordSchema.safeParse("12345678").success).toBe(false);
    expect(passwordSchema.safeParse("Secret123").success).toBe(true);
  });

  it("flags mismatched passwords on the confirm field", () => {
    const r = registerSchema.safeParse({ name: "Tola", email: "t@t.edu", password: "Secret123", confirmPassword: "Secret124" });
    expect(r.success).toBe(false);
    expect(!r.success && r.error.issues[0].path).toEqual(["confirmPassword"]);
  });

  it("coerces a select's string category id to a number", () => {
    const r = createRequestApiSchema.parse({ title: "Broken chair", description: "Leg is cracked", location: "Hall A", categoryId: "3", priority: "high" });
    expect(r.categoryId).toBe(3);
  });
});
