import Link from "next/link";
import {
  ArrowRight,
  ChevronRight,
  Flame,
  Sparkles,
  Swords,
  Timer,
  Trophy,
} from "lucide-react";
import { AchievementCard } from "@/components/achievement-card";
import { ActivityChart } from "@/components/activity-chart";
import { PageHeader } from "@/components/page-header";
import { QuestCard } from "@/components/quest-card";
import { SessionRow } from "@/components/session-row";
import { StatsGrid } from "@/components/stats-grid";
import { StatusWindow } from "@/components/status-window";
import { SystemPanel } from "@/components/system-panel";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { CountUp } from "@/components/motion/count-up";
import { GoalRing } from "@/components/motion/goal-ring";
import { getAppData } from "@/lib/data";
import { longDate } from "@/lib/dates";
import { formatNumber, progressUnit } from "@/lib/utils";

export default async function DashboardPage() {
  const data = await getAppData();
  const goalPercent = Math.min(
    100,
    (data.totals.todayMinutes / data.settings.dailyGoalMinutes) * 100,
  );
  const nextQuest =
    data.dailyQuests.find((quest) => !quest.claimed) ??
    data.weeklyQuests.find((quest) => !quest.claimed);
  const achievementPreview = [...data.achievements]
    .sort((a, b) => Number(b.earned) - Number(a.earned))
    .slice(0, 3);

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="System // Status"
        korean="상태"
        title="Hunter Status"
        description={`${longDate(data.todayKey)} · The System is monitoring your daily preparation.`}
        action={
          <Link href="/focus" className="system-button">
            <Timer className="h-4 w-4" />
            Enter focus gate
          </Link>
        }
      />

      <StatusWindow data={data} />

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.85fr]">
        <section className="boot-in boot-in-delay-1">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Swords className="h-4 w-4 text-glow" />
              <h2 className="hud-label hud-label--bright">Daily quests</h2>
              <span className="korean-accent">일일 퀘스트</span>
            </div>
            <Link
              href="/quests"
              className="system-link flex items-center gap-1 text-[0.62rem] tracking-[0.12em] uppercase"
            >
              All quests <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {data.dailyQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </section>

        <SystemPanel
          label="Focus gate"
          className="boot-in boot-in-delay-2 flex flex-col"
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-5 py-2">
            <GoalRing
              minutes={data.totals.todayMinutes}
              goal={data.settings.dailyGoalMinutes}
              percent={goalPercent}
            />

            <div className="w-full">
              <div className="mb-1.5 flex items-center justify-between text-[0.62rem] text-muted">
                <span className="hud-label">Daily progress</span>
                <CountUp
                  value={Math.round(goalPercent)}
                  suffix="%"
                  className="font-mono text-glow"
                />
              </div>
              <div className="stat-track">
                <AnimatedBar className="stat-fill" percent={goalPercent} />
              </div>
            </div>

            {nextQuest ? (
              <div className="w-full border border-[var(--accent-a012)] bg-[var(--panel-a04)] p-3">
                <p className="hud-label">Next objective</p>
                <p className="mt-1 truncate text-sm font-semibold text-ice">
                  {nextQuest.title}
                </p>
                <p className="mt-0.5 text-[0.66rem] text-muted">
                  {progressUnit(nextQuest.metric, nextQuest.progress)} /{" "}
                  {progressUnit(nextQuest.metric, nextQuest.target)}
                </p>
              </div>
            ) : (
              <div className="w-full border border-[rgb(var(--mint-rgb)/0.25)] bg-[rgb(var(--mint-rgb)/0.05)] p-3 text-center">
                <p className="text-sm font-semibold text-mint">
                  All available quests cleared.
                </p>
                <p className="mt-1 text-[0.65rem] text-muted">
                  Rest, Hunter. New quests arrive at midnight.
                </p>
              </div>
            )}

            {goalPercent >= 100 ? (
              <p className="flex items-center gap-1.5 text-center text-[0.65rem] tracking-[0.1em] text-mint uppercase">
                <Trophy className="h-3.5 w-3.5" />
                Daily preparation complete
              </p>
            ) : (
              <Link href="/focus" className="system-button w-full">
                <Flame className="h-4 w-4" />
                Begin session
              </Link>
            )}
          </div>
        </SystemPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <ActivityChart
          days={data.charts.lastSevenDays}
          todayKey={data.todayKey}
          weekMinutes={data.totals.weekMinutes}
        />

        <SystemPanel
          label="Hunter attributes"
          className="boot-in boot-in-delay-3"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="title-display text-xl text-ice">Attributes</h2>
              <p className="mt-1 text-xs text-muted">
                Your study actions shape each attribute.
              </p>
            </div>
            <span className="font-mono text-[0.6rem] text-muted">
              {formatNumber(data.stats.reduce((sum, stat) => sum + stat.xp, 0))}{" "}
              total SP
            </span>
          </div>
          <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <StatsGrid stats={data.stats} />
          </div>
        </SystemPanel>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <SystemPanel label="Recent sessions" className="boot-in">
          {data.recentSessions.length > 0 ? (
            <div>
              {data.recentSessions.map((session) => (
                <SessionRow key={session.id} session={session} />
              ))}
              <Link
                href="/sessions"
                className="mt-4 flex items-center justify-center gap-1.5 border border-[var(--accent-a015)] py-2 text-[0.64rem] font-semibold tracking-[0.14em] text-mist uppercase transition-colors hover:border-[var(--accent-a04)] hover:text-ice"
              >
                View full history <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          ) : (
            <div className="flex min-h-44 flex-col items-center justify-center text-center">
              <div className="grid h-12 w-12 place-items-center border border-[var(--accent-a02)] bg-[var(--accent2-a006)]">
                <Timer className="h-5 w-5 text-glow/70" />
              </div>
              <p className="mt-4 font-display text-lg text-ice">
                No sessions recorded
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                The System requires action. Enter the focus gate and complete
                your first session.
              </p>
              <Link href="/focus" className="system-button system-button--small mt-4">
                Start now
              </Link>
            </div>
          )}
        </SystemPanel>

        <SystemPanel
          label="Latest achievements"
          className="boot-in boot-in-delay-1"
        >
          <div className="space-y-2.5">
            {achievementPreview.map((achievement) => (
              <AchievementCard
                key={achievement.id}
                achievement={achievement}
                compact
              />
            ))}
          </div>
          <Link
            href="/progress#achievements"
            className="mt-4 flex items-center justify-center gap-1.5 border border-[var(--accent-a015)] py-2 text-[0.64rem] font-semibold tracking-[0.14em] text-mist uppercase transition-colors hover:border-[var(--accent-a04)] hover:text-ice"
          >
            <Sparkles className="h-3 w-3" /> All achievements
          </Link>
        </SystemPanel>
      </div>
    </div>
  );
}
