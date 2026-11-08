import { cn } from "@/lib/utils";

export function SystemSigil({ className }: { className?: string }) {
  return (
    <div className={cn("relative grid place-items-center", className)}>
      <svg
        viewBox="0 0 64 64"
        className="h-full w-full drop-shadow-[0_0_10px_rgba(84,221,255,0.55)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sigil-gradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#b8f4ff" />
            <stop offset="52%" stopColor="#54ddff" />
            <stop offset="100%" stopColor="#2c78c9" />
          </linearGradient>
        </defs>
        <path
          d="M32 2 58 17v30L32 62 6 47V17L32 2Z"
          fill="rgba(4,16,30,0.8)"
          stroke="url(#sigil-gradient)"
          strokeWidth="1.2"
        />
        <path
          d="M32 10 51 21v22L32 54 13 43V21L32 10Z"
          fill="none"
          stroke="rgba(84,221,255,0.32)"
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
          stroke="rgba(84,221,255,0.5)"
          strokeWidth="0.7"
        />
        <circle
          cx="32"
          cy="32"
          r="2.8"
          fill="#dcf6ff"
          className="drop-shadow-[0_0_5px_#54ddff]"
        />
        <path
          d="M32 5v6M32 53v6M9 19l5 3M50 42l5 3M55 19l-5 3M14 42l-5 3"
          stroke="rgba(84,221,255,0.45)"
          strokeWidth="0.8"
        />
      </svg>
    </div>
  );
}
