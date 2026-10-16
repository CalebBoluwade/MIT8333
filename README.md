# UniFix — University Maintenance Request Management

A full-stack Next.js application scaffold for reporting, assigning, and tracking university maintenance requests. It uses the requested stack: **Next.js App Router, TypeScript, Drizzle ORM, Turso/libSQL, shadcn-style UI primitives, Zod, React Hook Form, and Tailwind CSS**.

## Features in this starter

- Responsive landing page, sign-in, registration, and role-aware dashboard
- Roles: student, staff, maintenance officer, administrator
- Password hashing with bcrypt and signed JWT session cookie (`HttpOnly`, `SameSite=Lax`, `Secure` in production)
- Server-side authorization for API endpoints and request ownership checks
- Create and list service requests with Zod validation, status and priority
- Admin assignment of requests to maintenance officers
- Status transition validation and request status history
- In-app notification records for status changes and assignments
- Admin user role/access management and basic category/status reports
- Search/filter request list, API response pagination, indexes, and OpenAPI documentation

## Requirements

- Node.js 20.9+
- A Turso database, or local libSQL for development

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and configure `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN`, and a random `AUTH_SECRET` of at least 32 characters.

   Create a Turso database with the [Turso CLI](https://docs.turso.tech/cli/introduction) or dashboard, then obtain its database URL and auth token. For local-only development, use `TURSO_DATABASE_URL=file:local.db` and leave `TURSO_AUTH_TOKEN` blank.

3. Create tables and indexes:

   ```bash
   npm run db:push
   ```

4. Add the optional initial admin variables to `.env.local` (`SEED_ADMIN_NAME`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`) and seed categories plus the first admin:

   ```bash
   npm run db:seed
   ```

   Treat the seed password as a one-time bootstrap secret. Remove it from the deployment environment after seeding and use a strong password.

5. Start the app:

   ```bash
   npm run dev
   ```

   Open `http://localhost:3000`.

## Role setup

Public registration only permits `student` or `staff`. Sign in as the seeded administrator and open **Dashboard → Users** to promote approved accounts to `officer` or `admin`. Do not make role selection public: doing so would let a visitor grant themselves privileged access.

## API routes

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create student/staff account |
| POST | `/api/auth/login` | Public | Authenticate and set session cookie |
| POST | `/api/auth/logout` | Authenticated | Clear session cookie |
| GET | `/api/categories` | Authenticated | Active categories |
| GET / POST | `/api/requests` | Authenticated | List permitted requests / submit request |
| GET | `/api/requests/:id` | Owner, assigned officer, admin | Request details and timeline |
| POST | `/api/requests/:id/assign` | Admin | Assign maintenance officer |
| POST | `/api/requests/:id/status` | Assigned officer or admin | Validate transition, write history, notify requester |
| GET | `/api/admin/officers` | Admin | List maintenance officers for assignment |
| GET / PATCH | `/api/admin/users` | Admin | List accounts / update role and active state |

### List requests

`GET /api/requests?q=pipe&status=in_progress&page=1&limit=10`

Returns `{ data, page, limit, total }`. The API caps `limit` at 50. The current UI displays up to 100 filtered requests; pagination controls can be added as a next UI enhancement.

## Database model

- `users`: account identity, hashed password, role and active state
- `categories`: maintenance request categories
- `service_requests`: title, description, requester, category, location, priority, current status
- `assignments`: officer assignment history and active assignment flag
- `status_updates`: append-only status history/comments
- `notifications`: in-app notification records

Foreign keys represent one-to-many relationships. A request may have multiple historical assignments and status updates. The currently active assignment is identified by `assignments.active = true`.

## Security notes before production

This is an academic starter, not a security-audited production service. Before a real university deployment:

- Add rate limiting and abuse controls to authentication and write endpoints.
- Add CSRF/origin protections for cookie-authenticated mutation endpoints and consider session revocation/rotation.
- Verify the user is still active and their role is current against the database on privileged requests; signed role claims alone do not reflect later role changes until the token expires.
- Use a managed object store and signed uploads for image evidence. Uploads are not implemented in this starter yet.
- Add transactional writes for assignment/status/history/notification bundles. The current starter performs sequential writes and should be hardened for concurrency.
- Add audit events for administrative actions, email delivery, notification read state, CSV export, backup/restore, monitoring, and error reporting.
- Add rate-limited password reset, account verification, and institutional SSO if required.
- Restrict CORS if a separate API origin is used, enforce HTTPS, and use least-privilege secrets.
- Use a separate test database for automated integration tests.

## Testing and checks

```bash
npm run typecheck
npm run lint
npm run build
```

Automated tests have not been written or executed as part of this initial scaffold. Add Vitest/React Testing Library for form components, route tests for API authorization/validation, and Playwright for end-to-end flows before submitting.

## Deployment

- **Frontend/application:** deploy this Next.js app to Vercel or a Node-compatible host.
- **Database:** create a persistent Turso database and set `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` in the host's environment settings.
- **Secrets:** configure `AUTH_SECRET`; never commit `.env.local` or tokens.
- **Schema:** run `npm run db:push` during initial setup, or use reviewed Drizzle migrations (`npm run db:generate`, then `npm run db:migrate`) as the deployment process matures.
- **Seed:** run `npm run db:seed` once using the production environment only after checking the target database.
- **Verify:** test registration, login, request submission, admin assignment, officer status update, ownership boundaries, and persisted data against the deployed URL.

## Documentation

`docs/PROJECT_REPORT.md` contains a report draft and a checklist for replacing placeholders with actual screenshots, test results, and deployment evidence.
