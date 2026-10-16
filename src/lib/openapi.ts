const err = { description: "Error", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } };
const ok = (schema: object = { type: "object" }) => ({ description: "OK", content: { "application/json": { schema } } });
const idParam = { name: "id", in: "path", required: true, schema: { type: "integer" } };
const json = (ref: string) => ({ required: true, content: { "application/json": { schema: { $ref: `#/components/schemas/${ref}` } } } });
const secured = [{ cookieAuth: [] }];

export const openapi = {
  openapi: "3.0.3",
  info: {
    title: "CampusFix API",
    version: "1.0.0",
    description:
      "Service request platform for university maintenance. Authentication uses an httpOnly `session` cookie (JWT) set by the login endpoint.",
  },
  servers: [{ url: "/" }],
  tags: [
    { name: "Auth" },
    { name: "Requests" },
    { name: "Users" },
    { name: "Reports" },
    { name: "Other" },
  ],
  components: {
    securitySchemes: { cookieAuth: { type: "apiKey", in: "cookie", name: "session" } },
    schemas: {
      Error: {
        type: "object",
        properties: { error: { type: "string" }, fields: { type: "object", additionalProperties: { type: "string" } } },
      },
      Register: {
        type: "object",
        required: ["name", "email", "password", "confirmPassword"],
        properties: {
          name: { type: "string" },
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          confirmPassword: { type: "string" },
        },
      },
      Login: {
        type: "object",
        required: ["email", "password"],
        properties: { email: { type: "string", format: "email" }, password: { type: "string" } },
      },
      CreateRequest: {
        type: "object",
        required: ["title", "description", "location", "categoryId", "priority"],
        properties: {
          title: { type: "string", minLength: 5 },
          description: { type: "string", minLength: 10 },
          location: { type: "string" },
          categoryId: { type: "integer" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"] },
        },
      },
      Assign: {
        type: "object",
        required: ["officerId"],
        properties: { officerId: { type: "string" }, note: { type: "string" } },
      },
      StatusUpdate: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["pending", "assigned", "in_progress", "completed", "rejected", "cancelled"] },
          note: { type: "string" },
        },
      },
      UpdateUser: {
        type: "object",
        properties: { role: { type: "string", enum: ["student", "staff", "officer", "admin"] }, isActive: { type: "boolean" } },
      },
    },
  },
  paths: {
    "/api/auth/register": { post: { tags: ["Auth"], summary: "Create a student/staff account", requestBody: json("Register"), responses: { 201: ok(), 400: err, 409: err } } },
    "/api/auth/login": { post: { tags: ["Auth"], summary: "Sign in", requestBody: json("Login"), responses: { 200: ok(), 401: err } } },
    "/api/auth/logout": { post: { tags: ["Auth"], summary: "Sign out", responses: { 200: ok() } } },
    "/api/auth/me": { get: { tags: ["Auth"], summary: "Current user", security: secured, responses: { 200: ok(), 401: err } } },
    "/api/categories": { get: { tags: ["Requests"], summary: "List request categories", security: secured, responses: { 200: ok() } } },
    "/api/requests": {
      get: {
        tags: ["Requests"],
        summary: "List requests (scoped to the caller's role)",
        description: "Students see their own requests, officers see jobs assigned to them, admins see everything.",
        security: secured,
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "pageSize", in: "query", schema: { type: "integer", default: 10, maximum: 100 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Search title, description, location or id" },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "priority", in: "query", schema: { type: "string" } },
          { name: "categoryId", in: "query", schema: { type: "integer" } },
          { name: "officerId", in: "query", schema: { type: "string" }, description: "Admin only" },
        ],
        responses: { 200: ok(), 401: err },
      },
      post: { tags: ["Requests"], summary: "Submit a request", security: secured, requestBody: json("CreateRequest"), responses: { 201: ok(), 400: err, 401: err } },
    },
    "/api/requests/{id}": {
      get: { tags: ["Requests"], summary: "Request detail with status log and attachments", security: secured, parameters: [idParam], responses: { 200: ok(), 404: err } },
      patch: { tags: ["Requests"], summary: "Edit a request (owner while pending, or admin)", security: secured, parameters: [idParam], requestBody: json("CreateRequest"), responses: { 200: ok(), 409: err } },
      delete: { tags: ["Requests"], summary: "Delete a request (admin)", security: secured, parameters: [idParam], responses: { 200: ok(), 403: err } },
    },
    "/api/requests/{id}/assign": { post: { tags: ["Requests"], summary: "Assign or reassign to an officer (admin)", security: secured, parameters: [idParam], requestBody: json("Assign"), responses: { 200: ok(), 400: err, 403: err, 409: err } } },
    "/api/requests/{id}/status": { post: { tags: ["Requests"], summary: "Update status (allowed transitions depend on role)", security: secured, parameters: [idParam], requestBody: json("StatusUpdate"), responses: { 200: ok(), 409: err } } },
    "/api/requests/{id}/attachments": {
      post: {
        tags: ["Requests"],
        summary: "Upload an evidence image (JPG/PNG/WebP, max 1 MB, 3 per request)",
        security: secured,
        parameters: [idParam],
        requestBody: { required: true, content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } } } } } },
        responses: { 201: ok(), 400: err },
      },
    },
    "/api/attachments/{id}": { get: { tags: ["Requests"], summary: "Download an attachment", security: secured, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], responses: { 200: { description: "Image" }, 404: err } } },
    "/api/users": {
      get: { tags: ["Users"], summary: "List users (admin)", security: secured, parameters: [{ name: "q", in: "query", schema: { type: "string" } }, { name: "role", in: "query", schema: { type: "string" } }, { name: "page", in: "query", schema: { type: "integer" } }], responses: { 200: ok(), 403: err } },
      post: { tags: ["Users"], summary: "Create a user with any role (admin)", security: secured, responses: { 201: ok(), 409: err } },
    },
    "/api/users/{id}": { patch: { tags: ["Users"], summary: "Change role or activate/deactivate (admin)", security: secured, parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }], requestBody: json("UpdateUser"), responses: { 200: ok(), 409: err } } },
    "/api/officers": { get: { tags: ["Users"], summary: "Active maintenance officers (admin)", security: secured, responses: { 200: ok() } } },
    "/api/reports/summary": { get: { tags: ["Reports"], summary: "Counts by status and category, average resolution time", security: secured, responses: { 200: ok() } } },
    "/api/reports/export": { get: { tags: ["Reports"], summary: "Export requests as CSV (admin). Accepts the same filters as the list endpoint.", security: secured, responses: { 200: { description: "CSV file" } } } },
    "/api/notifications": {
      get: { tags: ["Other"], summary: "Latest notifications and unread count", security: secured, responses: { 200: ok() } },
      post: { tags: ["Other"], summary: "Mark all notifications read", security: secured, responses: { 200: ok() } },
    },
    "/api/audit-logs": { get: { tags: ["Other"], summary: "Audit trail (admin)", security: secured, responses: { 200: ok() } } },
  },
};
