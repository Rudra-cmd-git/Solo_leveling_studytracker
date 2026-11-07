import { Cpu, Database, HardDrive, Wifi } from "lucide-react";
import { CountUp } from "@/components/motion/count-up";
import { DataManager } from "@/components/data-manager";
import { PageHeader } from "@/components/page-header";
import { ProfileSettings } from "@/components/profile-settings";
import { SubjectManager } from "@/components/subject-manager";
import { SystemPanel } from "@/components/system-panel";
import { NotificationSettings } from "@/components/notification-settings";
import { OrientationSettings } from "@/components/orientation-settings";
import { getAppData } from "@/lib/data";
import { formatNumber } from "@/lib/utils";

export default async function SettingsPage() {
  const data = await getAppData();
  const usage = data.sessions.reduce<Record<number, number>>((counts, session) => {
    counts[session.subjectId] = (counts[session.subjectId] ?? 0) + 1;
    return counts;
  }, {});

  return (
    <div className="space-y-5 sm:space-y-6">
      <PageHeader
        eyebrow="System // Configuration"
        korean="설정"
        title="System Settings"
        description="Adjust your parameters. Changes are recorded locally and take effect immediately."
      />

      <OrientationSettings cinematicSeen={Boolean(data.settings.cinematicSeen)} />

      <div className="grid items-start gap-5 lg:grid-cols-[1.05fr_0.95fr]">
        <ProfileSettings name={data.player.name} settings={data.settings} />

        <div className="space-y-5">
          <SubjectManager subjects={data.subjects} usage={usage} />
          <DataManager />
        </div>
      </div>

      <SystemPanel label="System alerts" className="boot-in boot-in-delay-2">
        <NotificationSettings
          enabled={data.settings.notificationsEnabled}
          reminderTime={data.settings.reminderTime}
        />
      </SystemPanel>

      <SystemPanel label="System core" className="boot-in boot-in-delay-3">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <CoreInfo
            icon={Database}
            label="Database"
            value="libSQL"
            detail="Cloud-synced, single-user"
          />
          <CoreInfo
            icon={HardDrive}
            label="Recorded XP"
            value={formatNumber(data.progress.totalXp)}
            numericValue={data.progress.totalXp}
            detail={`Level ${data.progress.level} · ${data.progress.rank.rank}-Rank`}
          />
          <CoreInfo
            icon={Wifi}
            label="Network"
            value="Online"
            detail="Persisted in Turso"
          />
          <CoreInfo
            icon={Cpu}
            label="Schema"
            value="Version 1"
            detail="Study Tracker"
          />
        </div>
      </SystemPanel>
    </div>
  );
}

function CoreInfo({
  icon: Icon,
  label,
  value,
  numericValue,
  detail,
}: {
  icon: typeof Database;
  label: string;
  value: string;
  numericValue?: number;
  detail: string;
}) {
  return (
    <div className="border border-[var(--accent-a01)] bg-[var(--panel-a038)] px-3 py-3 transition-colors duration-200 hover:border-[var(--accent-a025)]">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-glow/60" strokeWidth={1.6} />
        <p className="hud-label">{label}</p>
      </div>
      <p className="mt-1.5 font-display text-base text-ice">
        {numericValue !== undefined ? <CountUp value={numericValue} /> : value}
      </p>
      <p className="mt-0.5 text-[0.6rem] text-muted">{detail}</p>
    </div>
  );
}
