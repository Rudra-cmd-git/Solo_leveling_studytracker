import type { ReactNode } from "react";

interface PageHeaderProps {
  eyebrow: string;
  title: string;
  korean?: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({
  eyebrow,
  title,
  korean,
  description,
  action,
}: PageHeaderProps) {
  return (
    <header className="boot-in flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <span className="hud-label hud-label--bright">{eyebrow}</span>
          {korean ? <span className="korean-accent">{korean}</span> : null}
        </div>
        <h1 className="title-display text-2xl text-white sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-mist sm:text-base">
            {description}
          </p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
