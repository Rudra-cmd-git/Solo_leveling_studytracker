import { Clock3, Flame, ShieldCheck, Sparkles, Swords } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { QuestCard } from "@/components/quest-card";
import { StreakFreeze } from "@/components/streak-freeze";
import { SystemPanel } from "@/components/system-panel";
import { getAppData } from "@/lib/data";
import { weekRangeLabel } from "@/lib/dates";
import { formatNumber } from "@/lib/utils";

export default async function QuestsPage() {
  const data = await getAppData();
  const dailyCleared = data.dailyQuests.filter((quest) => quest.claimed).length;
  const weeklyCleared = data.weeklyQuests.filter(
    (quest) => quest.claimed,
  ).length;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="System // Quests"
        korean="퀘스트"
        title="Quest Log"
        description="Quests are issued by the System. Complete the objective, claim the reward, and strengthen your Hunter attributes."
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <Directive
          icon={Swords}
          label="Daily quests"
          value={`${dailyCleared} / ${data.dailyQuests.length}`}
          detail="Resets at midnight"
        />
        <Directive
          icon={ShieldCheck}
          label="Weekly quests"
          value={`${weeklyCleared} / ${data.weeklyQuests.length}`}
          detail={weekRangeLabel(data.weekKey)}
        />
        <Directive
          icon={Flame}
          label="Active chain"
          value={`${data.streak.current} days`}
          detail={`Best: ${data.streak.best} days`}
        />
      </div>

      <section className="boot-in boot-in-delay-1">
        <div className="mb-3 flex items-center gap-2.5">
          <Swords className="h-4 w-4 text-glow" />
          <h2 className="hud-label hud-label--bright">Daily quests</h2>
          <span className="korean-accent">일일 퀘스트</span>
          <span className="ml-auto flex items-center gap-1.5 text-[0.6rem] tracking-[0.13em] text-muted uppercase">
            <Clock3 className="h-3 w-3" /> Resets at midnight
          </span>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {data.dailyQuests.map((quest) => (
            <QuestCard key={quest.id} quest={quest} />
          ))}
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.45fr_0.55fr]">
        <section className="boot-in boot-in-delay-2">
          <div className="mb-3 flex items-center gap-2.5">
            <Sparkles className="h-4 w-4 text-gold" />
            <h2 className="hud-label hud-label--bright">Weekly quests</h2>
            <span className="korean-accent">주간 퀘스트</span>
            <span className="ml-auto text-[0.6rem] tracking-[0.13em] text-muted uppercase">
              {weekRangeLabel(data.weekKey)}
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {data.weeklyQuests.map((quest) => (
              <QuestCard key={quest.id} quest={quest} />
            ))}
          </div>
        </section>

        <div className="space-y-5">
        <StreakFreeze streak={data.streak} />

        <SystemPanel label="Quest protocol" className="boot-in boot-in-delay-3">
          <div className="space-y-4">
            <p className="text-xs leading-relaxed text-mist">
              Daily quests reset every day at midnight in your configured
              timezone. Weekly quests reset on Monday.
            </p>
            <div className="divider-glow" />
            <div>
              <p className="hud-label">Rewards claimed</p>
              <p className="mt-1 font-display text-2xl text-ice">
                {data.totals.questsClaimed}
              </p>
              <p className="mt-1 text-[0.65rem] text-muted">
                Lifetime quest clears
              </p>
            </div>
            <div>
              <p className="hud-label">Total XP</p>
              <p className="mt-1 font-mono text-xl text-glow">
                {formatNumber(data.progress.totalXp)}
              </p>
            </div>
            <div className="border border-[rgba(84,221,255,0.14)] bg-[rgba(3,10,20,0.4)] p-3">
              <p className="hud-label">System warning</p>
              <p className="mt-1 text-[0.68rem] leading-relaxed text-muted">
                Unclaimed rewards are not lost. Claim them after completing the
                objective.
              </p>
            </div>
          </div>
        </SystemPanel>
        </div>
      </div>

      <SystemPanel className="boot-in" label="System notice">
        <p className="text-xs leading-relaxed text-muted">
          A missed daily quest breaks your study chain, but does not remove XP.
          The System records effort; it does not punish recovery.
        </p>
      </SystemPanel>
    </div>
  );
}

function Directive({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: typeof Swords;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className="system-panel system-panel--quiet px-3.5 py-3">
      <span className="panel-corner panel-corner--tl" />
      <span className="panel-corner panel-corner--br" />
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-glow/70" strokeWidth={1.6} />
        <p className="hud-label">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-xl text-ice">{value}</p>
      <p className="mt-0.5 text-[0.6rem] tracking-[0.08em] text-muted uppercase">
        {detail}
      </p>
    </div>
  );
}
