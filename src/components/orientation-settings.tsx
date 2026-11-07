"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { markCinematicSeen } from "@/app/actions";
import { SystemPanel } from "@/components/system-panel";

export function OrientationSettings({
  cinematicSeen,
}: {
  cinematicSeen: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  async function handleRewatch() {
    startTransition(async () => {
      const result = await markCinematicSeen(false);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  return (
    <SystemPanel label="System orientation" className="boot-in">
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="hud-label">Introduction cinematic</p>
            <p className="mt-0.5 text-[0.62rem] text-muted">
              {cinematicSeen
                ? "You have completed the System orientation."
                : "The orientation has not been viewed yet."}
            </p>
          </div>
          <button
            onClick={handleRewatch}
            disabled={isPending}
            className="system-button--ghost flex items-center gap-2 px-4 py-1.5 text-[0.65rem]"
          >
            {isPending ? (
              <span className="flex items-center gap-1.5 animate-pulse">
                <Play className="h-3 w-3" />
                Resetting...
              </span>
            ) : (
              <>
                <Play className="h-3 w-3" />
                {cinematicSeen ? "Rewatch Introduction" : "View Introduction"}
              </>
            )}
          </button>
        </div>
        <p className="mt-1 text-[0.6rem] text-muted tracking-[0.14em] uppercase">
          Replay the Hunter awakening guide on your next visit
        </p>
      </div>
    </SystemPanel>
  );
}
