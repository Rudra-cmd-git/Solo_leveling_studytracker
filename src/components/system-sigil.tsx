import { cn } from "@/lib/utils";

export function SystemSigil({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid place-items-center", className)}>
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full drop-shadow-[0_0_10px_var(--accent-a055)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sigil-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--accent-bright)" }} />
            <stop offset="52%" style={{ stopColor: "var(--accent)" }} />
            <stop offset="100%" style={{ stopColor: "var(--accent-deep)" }} />
          </linearGradient>
        </defs>
        <path
          d="M32 2 58 17v30L32 62 6 47V17L32 2Z"
          style={{ fill: "var(--panel)", fillOpacity: 0.8 }}
          stroke="url(#sigil-gradient)"
          strokeWidth="1.2"
        />
        <path
          d="M32 10 51 21v22L32 54 13 43V21L32 10Z"
          fill="none"
          style={{ stroke: "var(--accent-a032)" }}
          strokeWidth="0.8"
        />
        <path
          d="M32 17 43 32 32 47 21 32 32 17Z"
          fill="none"
          stroke="url(#sigil-gradient)"
          strokeWidth="1.4"
        />
        <path
          d="M32 22v20M22 32h20"
          style={{ stroke: "var(--accent-a05)" }}
          strokeWidth="0.7"
        />
        <circle
          cx="32"
          cy="32"
          r="2.8"
          style={{
            fill: "var(--text-ice)",
            filter: "drop-shadow(0 0 5px var(--accent))",
          }}
        />
        <path
          d="M32 5v6M32 53v6M9 19l5 3M50 42l5 3M55 19l-5 3M14 42l-5 3"
          style={{ stroke: "var(--accent-a045)" }}
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}
