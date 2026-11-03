import Link from "next/link";
import { Clock, Flame, Sparkles, Target } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { SessionForm } from "@/components/session-form";
import { SessionHistory } from "@/components/session-history";
import { SystemPanel } from "@/components/system-panel";
import { getAppData } from "@/lib/data";
import { formatMinutes } from "@/lib/game";

export default async function SessionsPage() {
  const data = await getAppData();
  const averageFocus =
    data.sessions.length > 0
      ? data.sessions.reduce(
          (sum, session) => sum + session.focusRating,
          0,
        ) / data.sessions.length
      : 0;

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="Archive // Records"
        korean="기록"
        title="Session Archive"
        description="Every session is recorded in the System. Log completed study, review your history, and keep the record honest."
        action={
          <Link href="/focus" className="system-button">
            <Clock className="h-4 w-4" /> Use focus timer
          </Link>
        }
      />

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <SummaryMetric
          icon={Clock}
          label="Total study"
          value={formatMinutes(data.totals.minutes)}
        />
        <SummaryMetric
          icon={Target}
          label="Sessions"
          value={`${data.totals.sessions}`}
        />
        <SummaryMetric
          icon={Flame}
          label="Best streak"
          value={`${data.streak.best} days`}
        />
        <SummaryMetric
          icon={Sparkles}
          label="Avg. focus"
          value={averageFocus > 0 ? `${averageFocus.toFixed(1)} / 5` : "—"}
        />
      </div>

      <div className="grid items-start gap-5 xl:grid-cols-[0.78fr_1.22fr]">
        <div className="xl:sticky xl:top-5">
          <SessionForm subjects={data.subjects} todayKey={data.todayKey} />
        </div>
        <SessionHistory
          sessions={data.sessions}
          subjects={data.subjects}
          todayKey={data.todayKey}
        />
      </div>

      <SystemPanel className="boot-in" label="System note">
        <p className="text-xs leading-relaxed text-muted">
          Deleting a session removes its XP, but quest rewards and achievements
          already claimed remain. The System does not erase proof of past
          progress.
        </p>
      </SystemPanel>
    </div>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock;
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
