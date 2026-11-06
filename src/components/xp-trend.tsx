import type { DayActivity } from "@/lib/types";
import { formatNumber } from "@/lib/utils";
import { SystemPanel } from "./system-panel";

export function XpTrend({ days }: { days: DayActivity[] }) {
  const width = 620;
  const height = 180;
  const paddingX = 10;
  const paddingY = 18;
  const maxXp = Math.max(...days.map((day) => day.xp), 100);
  const stepX = (width - paddingX * 2) / Math.max(1, days.length - 1);

  const points = days.map((day, index) => {
    const x = paddingX + index * stepX;
    const y =
      height -
      paddingY -
      (day.xp / maxXp) * (height - paddingY * 2);
    return { x, y, day };
  });

  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
  const area = `${line} L${points[points.length - 1]?.x ?? width - paddingX},${height - paddingY} L${paddingX},${height - paddingY} Z`;
  const total = days.reduce((sum, day) => sum + day.xp, 0);

  return (
    <SystemPanel label="Experience trend" className="boot-in boot-in-delay-1">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="title-display text-xl text-ice">
            {formatNumber(total)} XP
          </p>
          <p className="mt-1 text-[0.62rem] tracking-[0.14em] text-muted uppercase">
            Earned in the last 14 days
          </p>
        </div>
        <div className="text-right">
          <p className="hud-label">Daily peak</p>
          <p className="mt-1 font-mono text-sm text-glow">
            {formatNumber(maxXp)}
          </p>
        </div>
      </div>

      <div className="mt-4 w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="h-44 w-full"
          role="img"
          aria-label="XP earned over the last 14 days"
        >
          <defs>
            <linearGradient id="xp-area" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                style={{ stopColor: "var(--accent)", stopOpacity: 0.28 }}
              />
              <stop
                offset="100%"
                style={{ stopColor: "var(--accent)", stopOpacity: 0 }}
              />
            </linearGradient>
            <linearGradient id="xp-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" style={{ stopColor: "var(--accent-deep)" }} />
              <stop
                offset="100%"
                style={{ stopColor: "var(--accent-bright)" }}
              />
            </linearGradient>
          </defs>

          {[0.25, 0.5, 0.75, 1].map((fraction) => {
            const y = height - paddingY - fraction * (height - paddingY * 2);
            return (
              <line
                key={fraction}
                x1={paddingX}
                x2={width - paddingX}
                y1={y}
                y2={y}
                style={{ stroke: "var(--accent-a008)" }}
                strokeDasharray="2 6"
              />
            );
          })}

          <path className="xp-area" d={area} fill="url(#xp-area)" />
          <path
            className="xp-line"
            d={line}
            pathLength={1}
            fill="none"
            stroke="url(#xp-line)"
            strokeWidth="2"
            strokeLinejoin="round"
            strokeLinecap="round"
            style={{ filter: "drop-shadow(0 0 4px var(--accent-a055))" }}
          />

          {points.map((point, index) => (
            <g key={point.day.date}>
              <circle
                className="xp-point"
                cx={point.x}
                cy={point.y}
                r={point.day.xp > 0 ? 2.8 : 1.7}
                style={{
                  animationDelay: `${0.5 + index * 0.05}s`,
                  fill:
                    point.day.xp > 0
                      ? "var(--text-ice)"
                      : "var(--text-muted)",
                }}
              >
                <title>{`${point.day.date}: ${formatNumber(point.day.xp)} XP`}</title>
              </circle>
            </g>
          ))}

          {points.map((point, index) =>
            index % 2 === 0 ? (
              <text
                key={point.day.date}
                x={point.x}
                y={height - 2}
                textAnchor="middle"
                style={{ fill: "var(--text-muted)", opacity: 0.8 }}
                fontSize="8"
              >
                {point.day.label}
              </text>
            ) : null,
          )}
        </svg>
      </div>
    </SystemPanel>
  );
}
