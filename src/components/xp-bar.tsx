import { cn } from "@/lib/utils";

interface XpBarProps {
  percent: number;
  className?: string;
}

export function XpBar({ percent, className }: XpBarProps) {
  const safePercent = Math.min(100, Math.max(0, percent));
  return (
    <div
      className={cn("xp-track", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(safePercent)}
    >
      <div className="xp-fill" style={{ width: `${safePercent}%` }} />
    </div>
  );
}
