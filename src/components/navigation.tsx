"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  History,
  LayoutDashboard,
  Settings,
  Swords,
  Timer,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import type { ShellData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { RankBadge } from "./rank-badge";
import { SystemSigil } from "./system-sigil";
import { XpBar } from "./xp-bar";

interface NavigationItem {
  href: string;
  label: string;
  korean: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavigationItem[] = [
  {
    href: "/",
    label: "Status",
    korean: "상태",
    icon: LayoutDashboard,
  },
  {
    href: "/focus",
    label: "Focus",
    korean: "집중",
    icon: Timer,
  },
  {
    href: "/sessions",
    label: "Sessions",
    korean: "기록",
    icon: History,
  },
  {
    href: "/quests",
    label: "Quests",
    korean: "퀘스트",
    icon: Swords,
  },
  {
    href: "/progress",
    label: "Progress",
    korean: "성장",
    icon: TrendingUp,
  },
  {
    href: "/settings",
    label: "Settings",
    korean: "설정",
    icon: Settings,
  },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}

export function SideNavigation({ shell }: { shell: ShellData }) {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[18.5rem] flex-col border-r border-[rgba(84,221,255,0.12)] bg-[#030812]/88 px-4 py-5 backdrop-blur-xl lg:flex">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[rgba(84,221,255,0.35)] to-transparent" />

      <Link href="/" className="group flex items-center gap-3 px-2">
        <SystemSigil className="h-11 w-11 shrink-0 transition-transform duration-500 group-hover:rotate-6" />
        <div>
          <p className="title-display text-sm leading-none text-white">
            THE SYSTEM
          </p>
          <p className="mt-1.5 text-[0.58rem] font-semibold tracking-[0.28em] text-muted uppercase">
            Study Tracker
          </p>
        </div>
      </Link>

      <div className="mt-7 flex items-center gap-2 px-2">
        <span className="pulse-dot" />
        <span className="hud-label">System online</span>
        <span className="ml-auto font-mono text-[0.58rem] text-muted">v1.0</span>
      </div>

      <nav className="mt-4 flex flex-col gap-1" aria-label="Main navigation">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn("nav-item", active && "nav-item--active")}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4" strokeWidth={1.6} />
              <span className="flex-1">{item.label}</span>
              <span className="text-[0.56rem] tracking-[0.1em] text-muted/70">
                {item.korean}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto">
        <div className="divider-glow mb-4" />
        <div className="px-2">
          <div className="mb-3 flex items-center gap-3">
            <RankBadge rank={shell.progress.rank} compact />
            <div className="min-w-0">
              <p className="hud-label">Hunter</p>
              <p className="truncate text-base font-semibold text-ice">
                {shell.name}
              </p>
              <p className="text-[0.65rem] tracking-[0.15em] text-system uppercase">
                Lv. {shell.progress.level} · {shell.progress.rank.rank}-Rank
              </p>
            </div>
          </div>
          <div className="mb-1.5 flex items-center justify-between font-mono text-[0.58rem] text-muted">
            <span>XP</span>
            <span>
              {shell.progress.xpIntoLevel}/{shell.progress.xpForNext}
            </span>
          </div>
          <XpBar percent={shell.progress.percent} />
          <div className="mt-3 flex items-center justify-between text-[0.58rem] tracking-[0.18em] text-muted uppercase">
            <span>Next rank</span>
            <span className="text-ice/70">
              {shell.progress.rank.rank === "S"
                ? "MAX"
                : `${shell.progress.rank.minLevel + (shell.progress.rank.rank === "E" ? 9 : 10)} LV`}
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
}

export function MobileTopBar({ shell }: { shell: ShellData }) {
  return (
    <header className="sticky top-0 z-30 border-b border-[rgba(84,221,255,0.12)] bg-[#030812]/88 px-4 py-2.5 backdrop-blur-xl lg:hidden">
      <div className="flex items-center gap-3">
        <SystemSigil className="h-8 w-8" />
        <div className="min-w-0 flex-1">
          <p className="title-display truncate text-[0.72rem] leading-none text-white">
            THE SYSTEM
          </p>
          <p className="mt-1 truncate text-[0.58rem] tracking-[0.14em] text-muted uppercase">
            {shell.name} · Lv. {shell.progress.level}
          </p>
        </div>
        <div
          className="flex h-8 min-w-8 items-center justify-center border border-[rgba(84,221,255,0.28)] bg-[rgba(59,158,255,0.12)] px-2 font-display text-sm font-bold"
          style={{ color: shell.progress.rank.color }}
          title={`${shell.progress.rank.rank}-Rank`}
        >
          {shell.progress.rank.rank}
        </div>
      </div>
    </header>
  );
}

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(84,221,255,0.18)] bg-[#030812]/94 px-1 pb-[max(0.4rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-xl lg:hidden"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-6">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 px-0.5 py-1.5 text-[0.55rem] font-semibold tracking-[0.06em] uppercase transition-colors",
                active ? "text-glow" : "text-muted",
              )}
              aria-current={active ? "page" : undefined}
            >
              {active ? (
                <span className="absolute inset-x-2 top-0 h-px bg-glow shadow-[0_0_8px_#54ddff]" />
              ) : null}
              <Icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
