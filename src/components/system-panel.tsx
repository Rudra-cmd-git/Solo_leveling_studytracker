import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SystemPanelProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  hero?: boolean;
  quiet?: boolean;
  label?: string;
}

export function SystemPanel({
  children,
  className,
  hero = false,
  quiet = false,
  label,
  ...props
}: SystemPanelProps) {
  return (
    <section
      className={cn(
        "system-panel",
        hero && "system-panel--hero",
        quiet && "system-panel--quiet",
        className,
      )}
      {...props}
    >
      <span className="panel-corner panel-corner--tl" />
      <span className="panel-corner panel-corner--tr" />
      <span className="panel-corner panel-corner--bl" />
      <span className="panel-corner panel-corner--br" />
      {label ? (
        <div className="mb-3 flex items-center gap-2">
          <span className="hud-label hud-label--bright">{label}</span>
          <span className="h-px flex-1 bg-[rgba(84,221,255,0.12)]" />
        </div>
      ) : null}
      {children}
    </section>
  );
}
