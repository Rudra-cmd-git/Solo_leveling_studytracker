import Link from "next/link";
import { ArrowRight, Flame, Timer, Trophy, Zap } from "lucide-react";
import type { AppData } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { CountUp } from "./motion/count-up";
import { RankBadge } from "./rank-badge";
import { StatsGrid } from "./stats-grid";
import { SystemPanel } from "./system-panel";
import { XpBar } from "./xp-bar";

export function StatusWindow({ data }: { data: AppData }) {
  const totalHours = data.totals.minutes / 60;

  return (
    <SystemPanel hero className="boot-in overflow-hidden">
      <div className="status-orbit-outer pointer-events-none absolute top-1/2 -right-24 h-72 w-72 rounded-full border border-dashed border-[var(--accent-a008)]" />
      <div className="status-orbit-inner pointer-events-none absolute top-1/2 -right-10 h-40 w-40 rounded-full border border-[var(--accent-a011)]" />

      <div className="relative flex flex-col gap-7 xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="hud-label hud-label--bright">Status window</span>
            <span className="korean-accent">상태</span>
            <span className="ml-1 h-px w-16 bg-gradient-to-r from-[var(--accent-a045)] to-transparent" />
          </div>

          <div className="mt-5 flex items-center gap-5 sm:gap-6">
            <RankBadge rank={data.progress.rank} large />
            <div className="min-w-0">
              <p className="hud-label">Registered Hunter</p>
              <h2 className="title-display mt-1 truncate text-2xl text-white sm:text-4xl">
                {data.player.name}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="font-mono text-xs tracking-[0.14em] text-glow">
                  LEVEL <CountUp value={data.progress.level} />
                </span>
                <span className="h-3 w-px bg-[var(--accent-a022)]" />
                <span
                  className="text-[0.68rem] font-semibold tracking-[0.18em] uppercase"
                  style={{ color: data.progress.rank.color }}
                >
                  {data.progress.rank.rank}-Rank · {data.progress.rank.title}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 max-w-2xl">
            <div className="mb-2 flex items-end justify-between gap-3">
              <span className="hud-label">Experience</span>
              <span className="font-mono text-[0.68rem] text-mist">
                <CountUp
                  value={data.progress.xpIntoLevel}
                  className="text-glow"
                />
                <span className="text-muted">
                  {" "}
                  / <CountUp value={data.progress.xpForNext} /> XP
                </span>
              </span>
            </div>
            <XpBar percent={data.progress.percent} />
            <div className="mt-2 flex justify-between text-[0.6rem] tracking-[0.16em] text-muted uppercase">
              <span>Lv. {data.progress.level}</span>
              <span>Total {formatNumber(data.progress.totalXp)} XP</span>
              <span>Lv. {data.progress.level + 1}</span>
            </div>
          </div>
        </div>

        <div className="grid w-full shrink-0 grid-cols-2 gap-2 xl:w-[21rem]">
          <MetricCard
            icon={Flame}
            label="Streak"
            value={data.streak.current}
            suffix="days"
            accent="text-gold"
          />
          <MetricCard
            icon={Timer}
            label="Today"
            value={data.totals.todayMinutes}
            format="minutes"
            suffix={`/ ${data.settings.dailyGoalMinutes}m goal`}
            accent="text-glow"
          />
          <MetricCard
            icon={Zap}
            label="Total study"
            value={totalHours}
            format="hours"
            suffix={`${data.totals.sessions} sessions`}
            accent="text-system"
          />
          <MetricCard
            icon={Trophy}
            label="Quests cleared"
            value={data.totals.questsClaimed}
            suffix="claimed"
            accent="text-mint"
          />
        </div>
      </div>

      <div className="mt-6 grid gap-2 border-t border-[var(--accent-a01)] pt-5 sm:grid-cols-2 xl:grid-cols-5">
        <StatsGrid stats={data.stats} compact />
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-muted">
          <span className="pulse-dot" />
          {data.streak.current > 0
            ? `Chain active. Protect your ${data.streak.current}-day streak.`
            : "No active chain. Enter the focus gate to begin."}
        </p>
        <Link
          href="/focus"
          className="system-link flex items-center gap-1.5 text-xs tracking-[0.12em] uppercase"
        >
          Enter focus gate <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </SystemPanel>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  format,
  suffix,
  accent,
}: {
  icon: typeof Flame;
  label: string;
  value: number;
  format?: "number" | "minutes" | "hours" | "decimal";
  suffix: string;
  accent: string;
}) {
  return (
    <div className="border border-[var(--accent-a011)] bg-[var(--panel-a048)] px-3 py-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--accent-a024)]">
      <div className="flex items-center gap-1.5">
        <Icon className={cn("h-3.5 w-3.5", accent, label === "Streak" && value > 0 && "animate-flame-flicker")} strokeWidth={1.7} />
        <span className="hud-label">{label}</span>
      </div>
      <CountUp
        value={value}
        format={format}
        className="mt-2 block truncate font-display text-xl font-semibold text-ice"
      />
      <p className="mt-0.5 truncate text-[0.6rem] tracking-[0.08em] text-muted uppercase">
        {suffix}
      </p>
    </div>
  );
}
