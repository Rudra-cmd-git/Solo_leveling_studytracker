import Link from "next/link";
import { AlertTriangle, CircleCheck, Flame, Shield, Sparkles } from "lucide-react";
import { FocusTimer } from "@/components/focus-timer";
import { AnimatedBar } from "@/components/motion/animated-bar";
import { StreakAlert } from "@/components/streak-alert";
import { GoalRing } from "@/components/motion/goal-ring";
import { PageHeader } from "@/components/page-header";
import { SystemPanel } from "@/components/system-panel";
import { getAppData } from "@/lib/data";
import { longDate } from "@/lib/dates";
import { progressUnit } from "@/lib/utils";

export default async function FocusPage() {
  const data = await getAppData();

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Gate // Focus"
        korean="집중"
        title="Focus Gate"
        description="A focused session is the only way to gain XP. Select your target, enter the gate, and do not leave until the System records your effort."
      />

      {data.streak.atRisk && (
        <div className="border border-[rgba(255,84,104,0.4)] bg-[rgba(255,84,104,0.08)] p-4 rounded flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-5 w-5 text-[#ff8296] shrink-0" />
          <div>
            <p className="font-semibold text-[#ffb1bd] text-[0.66rem] uppercase tracking-[0.1em]">
              Streak at risk
            </p>
            <p className="mt-1 text-[0.62rem] text-muted leading-snug">
              Your {data.streak.current}-day streak will break if you don&apos;t log a session today. Enter the focus gate to keep it alive.
            </p>
          </div>
        </div>
      )}
      <StreakAlert
        atRisk={data.streak.atRisk}
        current={data.streak.current}
        notificationsEnabled={data.settings.notificationsEnabled}
      />

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <FocusTimer
          subjects={data.subjects}
          defaultMinutes={data.settings.defaultTimerMinutes}
          todayKey={data.todayKey}
        />

        <div className="space-y-5">
          <SystemPanel label="Daily goal" className="boot-in boot-in-delay-1">
            <div className="space-y-4">
              <GoalRing
                minutes={data.totals.todayMinutes}
                goal={data.settings.dailyGoalMinutes}
                percent={
                  data.settings.dailyGoalMinutes > 0
                    ? Math.min(100, (data.totals.todayMinutes / data.settings.dailyGoalMinutes) * 100)
                    : 0
                }
              />
              {data.totals.todayMinutes >= data.settings.dailyGoalMinutes ? (
                <p className="mt-2 text-[0.6rem] tracking-[0.1em] text-mint font-semibold uppercase">
                  Goal reached
                </p>
              ) : (
                <p className="mt-2 text-[0.6rem] tracking-[0.1em] text-muted uppercase">
                  {data.settings.dailyGoalMinutes - data.totals.todayMinutes}m remaining
                </p>
              )}
            </div>
          </SystemPanel>

          <SystemPanel label="Current objectives" className="boot-in-delay-1 boot-in">
            <div className="space-y-4">
              {data.dailyQuests.map((quest) => (
                <div key={quest.id}>
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-xs font-semibold text-ice">
                      {quest.title}
                    </p>
                    <span className={quest.complete ? "text-mint" : "text-muted"}>
                      {quest.complete ? (
                        <CircleCheck className="h-3.5 w-3.5" />
                      ) : (
                        <span className="font-mono text-[0.58rem]">
                          {Math.round(quest.percent)}%
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="mt-1.5 stat-track">
                    <AnimatedBar
                      className="stat-fill"
                      percent={quest.percent}
                    />
                  </div>
                  <p className="mt-1 text-[0.58rem] tracking-[0.06em] text-muted uppercase">
                    {progressUnit(quest.metric, quest.progress)} /{" "}
                    {progressUnit(quest.metric, quest.target)}
                  </p>
                </div>
              ))}
            </div>
            <Link
              href="/quests"
              className="mt-4 block border border-[rgba(84,221,255,0.15)] py-2 text-center text-[0.62rem] font-semibold tracking-[0.14em] text-mist uppercase transition-colors hover:border-[rgba(84,221,255,0.4)] hover:text-ice"
            >
              Open quest log
            </Link>
          </SystemPanel>

          <SystemPanel label="Today's status" className="boot-in-delay-2 boot-in">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="hud-label">Streak</p>
                <p className="mt-1 flex items-center gap-1.5 font-display text-2xl text-gold">
                  <Flame className="h-4 w-4" />
                  {data.streak.current}
                  <span className="text-[0.6rem] tracking-[0.1em] text-muted uppercase">
                    days
                  </span>
                </p>
              </div>
              <div>
                <p className="hud-label">Total XP</p>
                <p className="mt-1 font-mono text-xl text-glow">
                  {data.progress.totalXp}
                </p>
              </div>
            </div>
            <div className="divider-glow my-4" />
            <p className="text-[0.66rem] leading-relaxed text-muted">
              {longDate(data.todayKey)}
            </p>
          </SystemPanel>

          <SystemPanel label="Focus protocol" className="boot-in-delay-3 boot-in">
            <div className="space-y-3">
              <ProtocolLine
                icon={Shield}
                title="Remove distractions"
                text="Phone away. Tabs closed. The gate demands attention."
              />
              <ProtocolLine
                icon={Sparkles}
                title="Name the objective"
                text="A precise topic earns a cleaner reflection."
              />
              <ProtocolLine
                icon={CircleCheck}
                title="Record the result"
                text="Log focus quality and notes after the session."
              />
            </div>
          </SystemPanel>
        </div>
      </div>
    </div>
  );
}

function ProtocolLine({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Shield;
  title: string;
  text: string;
}) {
  return (
    <div className="flex gap-2.5">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-glow/70" strokeWidth={1.5} />
      <div>
        <p className="text-xs font-semibold text-ice">{title}</p>
        <p className="mt-0.5 text-[0.66rem] leading-snug text-muted">{text}</p>
      </div>
    </div>
  );
}
