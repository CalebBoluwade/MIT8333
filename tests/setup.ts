import { vi } from "vitest";
import { File as NodeFile } from "node:buffer";

// jsdom ships a broken File implementation that can't be used with undici's
// FormData parser. Replace it with node:buffer's File so upload tests work.
(globalThis as unknown as Record<string, unknown>).File = NodeFile;

// Route handlers read the session through next/headers, which only exists inside a
// Next.js request. Replace it with an in-memory cookie jar the tests can control.
vi.mock("next/headers", async () => {
  const { jar } = await import("./cookie-jar");
  return {
    cookies: async () => ({
      get: (name: string) => (jar.has(name) ? { name, value: jar.get(name)! } : undefined),
      set: (name: string, value: string) => void jar.set(name, value),
      delete: (name: string) => void jar.delete(name),
    }),
  };
});
