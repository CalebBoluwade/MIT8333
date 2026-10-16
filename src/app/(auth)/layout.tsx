import { CheckCircle2, Wrench } from "lucide-react";

const features = [
  "Submit maintenance requests in seconds",
  "Track status from pending to completed",
  "Get notified on every update",
];

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1fr_26rem]">
      {/* Left panel */}
      <section
        style={{
          background: "linear-gradient(145deg, #0d0f14 0%, #1e1b4b 55%, #2e1065 100%)",
        }}
        className="relative hidden overflow-hidden p-12 lg:flex lg:flex-col lg:justify-between"
      >
        {/* Glow orbs */}
        <div
          aria-hidden
          style={{
            background: "radial-gradient(circle at center, rgba(99,102,241,0.35), transparent 65%)",
            width: 520, height: 520, top: -140, left: -140,
          }}
          className="pointer-events-none absolute rounded-full"
        />
        <div
          aria-hidden
          style={{
            background: "radial-gradient(circle at center, rgba(139,92,246,0.22), transparent 65%)",
            width: 380, height: 380, bottom: -100, right: -100,
          }}
          className="pointer-events-none absolute rounded-full"
        />

        {/* Brand */}
        <div className="relative flex items-center gap-3">
          <span
            style={{ background: "#4f46e5", boxShadow: "0 4px 20px rgba(79,70,229,0.5)" }}
            className="flex size-10 items-center justify-center rounded-xl"
          >
            <Wrench className="size-5 text-white" aria-hidden />
          </span>
          <span className="text-lg font-semibold text-white">UniFix</span>
        </div>

        {/* Hero copy */}
        <div className="relative max-w-sm">
          <p className="text-[2.4rem] font-bold leading-[1.15] tracking-tight text-white">
            Report it once.{" "}
            <span style={{ color: "#a5b4fc" }}>Watch it get fixed.</span>
          </p>
          <p className="mt-5 text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.55)" }}>
            Faulty lights, leaking pipes, broken desks and dead Wi-Fi go straight to the people who can fix them — with every update on record.
          </p>

          <ul className="mt-7 space-y-3">
            {features.map((f) => (
              <li key={f} className="flex items-center gap-3">
                <CheckCircle2 className="size-4 shrink-0 text-indigo-400" aria-hidden />
                <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{f}</span>
              </li>
            ))}
          </ul>

          {/* Social proof */}
          <div className="mt-8 flex items-center gap-3">
            <div className="flex -space-x-2">
              {["A", "M", "J", "R"].map((l) => (
                <span
                  key={l}
                  style={{ background: "rgba(99,102,241,0.3)", border: "2px solid #1e1b4b", color: "#c7d2fe" }}
                  className="flex size-8 items-center justify-center rounded-full text-xs font-semibold"
                >
                  {l}
                </span>
              ))}
            </div>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Trusted by students &amp; staff
            </p>
          </div>
        </div>

        <p className="relative text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
          University facilities service desk
        </p>
      </section>

      {/* Right panel */}
      <section className="flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-sm">
          {/* Mobile brand */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span style={{ background: "#4f46e5" }} className="flex size-8 items-center justify-center rounded-lg">
              <Wrench className="size-4 text-white" aria-hidden />
            </span>
            <span className="font-semibold">UniFix</span>
          </div>
          {children}
        </div>
      </section>
    </main>
  );
}
