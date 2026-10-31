import Link from "next/link";
import { Award, Flame, Sparkles, TrendingUp, Zap } from "lucide-react";
import { AchievementCard } from "@/components/achievement-card";
import { Heatmap } from "@/components/heatmap";
import { PageHeader } from "@/components/page-header";
import { RankBadge } from "@/components/rank-badge";
import { RankLadder } from "@/components/rank-ladder";
import { SubjectBreakdown } from "@/components/subject-breakdown";
import { SystemPanel } from "@/components/system-panel";
import { XpBar } from "@/components/xp-bar";
import { XpTrend } from "@/components/xp-trend";
import { getAppData } from "@/lib/data";
import { formatMinutes } from "@/lib/game";
import { formatNumber } from "@/lib/utils";

export default async function ProgressPage() {
  const data = await getAppData();
  const earned = data.achievements.filter(
    (achievement) => achievement.earned,
  ).length;
  const activeDays = data.charts.heatmap.filter((day) => day.minutes > 0).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="System // Growth"
        korean="성장"
        title="Hunter Progress"
        description="Levels, ranks, attributes, and achievements are proof that the System recognizes your effort."
        action={
          <Link href="/focus" className="system-button">
            <TrendingUp className="h-4 w-4" /> Gain XP
          </Link>
        }
      />

      <SystemPanel hero className="boot-in">
        <div className="grid gap-7 lg:grid-cols-[auto_1fr] lg:items-center">
          <div className="flex items-center gap-5">
            <RankBadge rank={data.progress.rank} large />
            <div>
              <p className="hud-label">Current rank</p>
              <p
                className="mt-1 font-display text-3xl font-semibold"
                style={{ color: data.progress.rank.color }}
              >
                {data.progress.rank.rank}
              </p>
              <p className="mt-1 text-[0.65rem] tracking-[0.15em] text-mist uppercase">
                {data.progress.rank.title}
              </p>
            </div>
          </div>

          <div>
            <div className="mb-2 flex flex-wrap items-end justify-between gap-2">
              <div>
                <p className="hud-label">Level {data.progress.level}</p>
                <p className="mt-1 font-mono text-xs text-mist">
                  <span className="text-glow">
                    {formatNumber(data.progress.xpIntoLevel)}
                  </span>{" "}
                  / {formatNumber(data.progress.xpForNext)} XP to next level
                </p>
              </div>
              <p className="font-mono text-[0.65rem] text-muted">
                TOTAL {formatNumber(data.progress.totalXp)} XP
              </p>
            </div>
            <XpBar percent={data.progress.percent} />
            <div className="mt-3 flex justify-between text-[0.58rem] tracking-[0.12em] text-muted uppercase">
              <span>Level {data.progress.level}</span>
              <span>Level {data.progress.level + 1}</span>
            </div>
            <div className="mt-5">
              <RankLadder progress={data.progress} />
            </div>
          </div>
        </div>
      </SystemPanel>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Metric
          icon={Zap}
          label="Total study"
          value={formatMinutes(data.totals.minutes)}
        />
        <Metric
          icon={Flame}
          label="Best streak"
          value={`${data.streak.best} days`}
        />
        <Metric
          icon={Award}
          label="Achievements"
          value={`${earned} / ${data.achievements.length}`}
        />
        <Metric
          icon={TrendingUp}
          label="Active days"
          value={`${activeDays} / 84`}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <XpTrend days={data.charts.lastFourteenDays} />
        <SubjectBreakdown subjects={data.charts.subjects} />
      </div>

      <Heatmap days={data.charts.heatmap} />

      <section id="achievements" className="scroll-mt-6 boot-in">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="hud-label hud-label--bright">Achievements</h2>
            <span className="korean-accent">업적</span>
          </div>
          <span className="font-mono text-[0.62rem] text-muted">
            {earned} unlocked
          </span>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-3">
          {data.achievements.map((achievement) => (
            <AchievementCard
              key={achievement.id}
              achievement={achievement}
            />
          ))}
        </div>
      </section>

      <SystemPanel label="System assessment" className="boot-in">
        <p className="text-xs leading-relaxed text-muted">
          Rank is determined by level. Reach level 10 for D-Rank, 20 for C-Rank,
          30 for B-Rank, 40 for A-Rank, and 50 for S-Rank. Attributes increase
          through study time, focus, quests, streaks, and reflections.
        </p>
      </SystemPanel>
    </div>
  );
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Zap;
  label: string;
  value: string;
}) {
  return (
    <div className="system-panel system-panel--quiet px-3 py-3">
      <span className="panel-corner panel-corner--tl" />
      <span className="panel-corner panel-corner--br" />
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-glow/70" strokeWidth={1.6} />
        <p className="hud-label">{label}</p>
      </div>
      <p className="mt-1.5 truncate font-display text-lg text-ice">{value}</p>
    </div>
  );
}
