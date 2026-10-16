import "dotenv/config";
import { hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "../src/db";
import { categories, roles, users } from "../src/db/schema";
import type { RoleName } from "../src/db/schema";

const ROLES: { name: RoleName; label: string }[] = [
  { name: "student", label: "Student" },
  { name: "staff", label: "Staff" },
  { name: "officer", label: "Maintenance Officer" },
  { name: "admin", label: "Administrator" },
];

for (const r of ROLES) {
  const existing = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, r.name))
    .get();
  if (!existing) await db.insert(roles).values(r);
}

const CATEGORIES = [
  ["Electrical", "Faulty lights, sockets, wiring, or power supply"],
  ["Plumbing", "Leaking pipes, taps, toilets, or drainage"],
  ["Furniture", "Damaged desks, chairs, cupboards, or fittings"],
  ["Internet & Network", "Wi-Fi, network ports, and connectivity issues"],
  [
    "Classroom Equipment",
    "Projectors, speakers, screens, and teaching equipment",
  ],
  ["Hostel Maintenance", "Hostel rooms, doors, windows, and shared facilities"],
  ["Cleaning & Sanitation", "Waste, cleaning, and sanitation issues"],
  ["Other", "Maintenance issues not covered by another category"],
] as const;

for (const [name, description] of CATEGORIES) {
  const existing = await db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.name, name))
    .get();
  if (!existing) await db.insert(categories).values({ name, description });
}

if (
  process.env.SEED_ADMIN_EMAIL &&
  process.env.SEED_ADMIN_PASSWORD &&
  process.env.SEED_ADMIN_NAME
) {
  const email = process.env.SEED_ADMIN_EMAIL.toLowerCase();
  const adminRole = await db
    .select({ id: roles.id })
    .from(roles)
    .where(eq(roles.name, "admin"))
    .get();
  if (!adminRole) throw new Error("Admin role not found after seeding roles");
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .get();
  if (!existing) {
    await db.insert(users).values({
      id: randomUUID(),
      name: process.env.SEED_ADMIN_NAME,
      email,
      passwordHash: await hash(process.env.SEED_ADMIN_PASSWORD, 12),
      roleId: adminRole.id,
    });
    console.info(`Created initial administrator: ${email}`);
  } else {
    console.info(`Administrator account already exists: ${email}`);
  }
} else {
  console.info(
    "Skipping admin creation; set SEED_ADMIN_NAME, SEED_ADMIN_EMAIL, and SEED_ADMIN_PASSWORD.",
  );
}

console.info("UniFix seed completed.");
