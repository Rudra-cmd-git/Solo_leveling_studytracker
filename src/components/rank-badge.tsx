import type { CSSProperties } from "react";
import type { RankInfo } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RankBadgeProps {
  rank: RankInfo;
  className?: string;
  compact?: boolean;
  large?: boolean;
}

export function RankBadge({
  rank,
  className,
  compact = false,
  large = false,
}: RankBadgeProps) {
  return (
    <div
      className={cn(
        "rank-badge",
        compact && "rank-badge--compact",
        large && "rank-badge--large",
        className,
      )}
      style={{ "--rank-color": rank.color } as CSSProperties}
      aria-label={`${rank.rank}-rank: ${rank.title}`}
    >
      <span className="rank-badge__letter">{rank.rank}</span>
    </div>
  );
}
