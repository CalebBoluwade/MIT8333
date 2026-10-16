# UniFix: University Maintenance Request Management System

> **Submission note:** This is a report draft. Replace all bracketed items with information from your actual implementation and deployment. Do not claim tests passed or the system was deployed until you have executed the tests and verified the live site.

## 1. Introduction

Universities depend on reliable buildings, electrical systems, plumbing, classroom equipment, internet connectivity, and hostel facilities. When faults are reported through phone calls, paper forms, messaging applications, and office visits, records can become fragmented and requesters may not know whether a problem has been assigned or resolved.

UniFix is a web-based University Maintenance Request Management System intended to centralize maintenance reporting, provide traceable assignments, and make request status visible to authorized users.

### Problem statement

The existing manual process creates delays, missing records, limited progress visibility, and unclear accountability. A central digital platform is required to capture structured reports, route work to maintenance personnel, preserve status history, and support administrative monitoring.

### Aim and objectives

The aim is to design and implement a web application that improves the recording and management of campus maintenance requests. Objectives are to:

1. Provide secure registration and authentication for university users.
2. Allow students and staff to submit and track maintenance requests.
3. Allow administrators to manage accounts and assign maintenance officers.
4. Allow officers to update assigned jobs and record work notes.
5. Preserve status history and notify relevant users of changes.
6. Provide request search, filtering, operational summaries, and API documentation.
7. Test key workflows and deploy the application with a persistent hosted database.

## 2. Requirement analysis

### Functional requirements

- Register and authenticate accounts.
- Restrict public registration to student and staff roles.
- Submit requests with title, category, location, description, and priority.
- View requests according to role and ownership/assignment.
- Assign jobs to active maintenance officers.
- Enforce allowed status transitions and retain a timeline.
- Generate in-app notification records on assignments and status changes.
- Manage account roles and active state as an administrator.
- Review request counts by category and status.

### Non-functional requirements

- Responsive user interface and accessible form labels.
- Server-side input validation and authorization.
- Password hashing and secure HTTP-only session cookies.
- Persistent database storage and referential integrity.
- Useful error responses and searchable request lists.
- Maintainable code with TypeScript types and database migrations.

## 3. Technologies used

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, reusable shadcn-style UI primitives, Lucide icons, React Hook Form, and Zod.
- **Backend:** Next.js Route Handlers implementing a versioned-style REST API.
- **ORM:** Drizzle ORM for typed queries and schema management.
- **Database:** Turso/libSQL, a SQLite-compatible hosted relational database.
- **Authentication:** bcrypt password hashing and signed JWT stored in an HTTP-only cookie.
- **Validation:** Zod schemas shared between form and API logic.

## 4. Database design

The database includes users, categories, service requests, assignments, status updates, and notifications. Users have one role at a time. One user may submit many requests. Each request belongs to a category and can have multiple assignment records and status updates. Notifications belong to users. Foreign keys connect related records and indexes support email lookup, status filtering, requester filtering, and history retrieval.

Insert the generated ER diagram here: **[Add ER diagram screenshot/export]**.

## 5. API documentation

The API supports account registration/login/logout, category retrieval, request listing/creation/detail retrieval, assignment, status updates, officer listing, and user administration. Requests are validated with Zod. Unauthorized requests return 401, forbidden operations return 403, invalid input returns 400, missing records return 404, and conflicting status transitions return 409 where applicable.

Add an OpenAPI/Swagger document or Postman collection before final submission: **[Add API documentation URL or screenshots]**.

## 6. Interface screenshots

Add real screenshots from your running application. Suggested evidence:

1. Landing page.
2. Registration and login pages.
3. Student/staff dashboard.
4. New service request form with validation feedback.
5. Request list and detail timeline.
6. Administrator user management.
7. Assignment interface.
8. Officer status update interface.
9. Category/status report.
10. Mobile/responsive view.

## 7. Testing

Complete this table with actual results after executing the tests.

| Test case | Expected result | Actual result | Status |
|---|---|---|---|
| Register with valid student details | Account created and session set | [Record result] | [Pass/Fail] |
| Register with invalid email/password | Validation error | [Record result] | [Pass/Fail] |
| Login with invalid credentials | Request rejected | [Record result] | [Pass/Fail] |
| Student views another user's request | Access denied/not found | [Record result] | [Pass/Fail] |
| Admin assigns a maintenance officer | Assignment saved and officer notified | [Record result] | [Pass/Fail] |
| Unassigned officer updates request | Access denied | [Record result] | [Pass/Fail] |
| Invalid status transition | Conflict response | [Record result] | [Pass/Fail] |
| Valid status transition | Current status and history updated | [Record result] | [Pass/Fail] |
| Production database connectivity | Records persist after reload | [Record result] | [Pass/Fail] |

## 8. Deployment

- Hosting provider: [Fill in]
- Live URL: [Fill in]
- Database: Turso/libSQL
- Environment variables configured: [List variable names only; never include secret values]
- Deployment date: [Fill in]
- Production smoke-test results: [Fill in]

## 9. Challenges and solutions

Potential challenges include protecting user-specific request data, managing role-specific access, preserving an accurate status history, configuring hosted database credentials, and keeping production secrets out of source control. UniFix addresses these through server-side permission checks, schema constraints, Zod validation, status-history records, and environment-based configuration. Record the actual issues encountered during implementation and the solutions applied.

## 10. Conclusion and future work

UniFix provides a foundation for centralized maintenance reporting and traceable request handling. Future work includes secure image uploads, email notifications, real-time updates, CSV/PDF export, automated testing, stronger session revocation, and institution-wide single sign-on. The final conclusion should be updated to reflect features implemented and verified in the deployed version.
