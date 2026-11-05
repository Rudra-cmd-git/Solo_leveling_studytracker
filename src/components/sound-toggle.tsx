"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Volume2, VolumeX } from "lucide-react";
import { setSoundEnabled } from "@/app/actions";
import { cn } from "@/lib/utils";
import { useSfx } from "./sound-provider";

export function SoundToggle({ compact = false }: { compact?: boolean }) {
  const { enabled, play, stopAmbience } = useSfx();
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isOn = enabled;

  function toggle() {
    if (isPending) return;
    const next = !isOn;

    if (!next) stopAmbience();

    startTransition(async () => {
      const result = await setSoundEnabled(next);
      if (!result.ok) return;

      if (next) play("ui.confirm", { force: true });
      router.refresh();
    });
  }

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        disabled={isPending}
        aria-pressed={isOn}
        aria-label={isOn ? "Mute dungeon audio" : "Enable dungeon audio"}
        title={isOn ? "Mute dungeon audio" : "Enable dungeon audio"}
        className={cn(
          "icon-button h-8 w-8 shrink-0",
          isOn && "border-[rgba(84,221,255,0.44)] text-glow",
          isPending && "opacity-50",
        )}
      >
        {isOn ? (
          <Volume2 className="h-3.5 w-3.5" />
        ) : (
          <VolumeX className="h-3.5 w-3.5" />
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={isPending}
      aria-pressed={isOn}
      className={cn(
        "flex w-full items-center gap-2 border px-2 py-2 text-left transition-colors",
        isOn
          ? "border-[rgba(84,221,255,0.28)] bg-[rgba(59,158,255,0.08)] hover:border-[rgba(84,221,255,0.48)]"
          : "border-[rgba(84,221,255,0.1)] bg-[rgba(3,10,20,0.4)] hover:border-[rgba(84,221,255,0.28)]",
        isPending && "opacity-60",
      )}
    >
      {isOn ? (
        <Volume2 className="h-3.5 w-3.5 shrink-0 text-glow" />
      ) : (
        <VolumeX className="h-3.5 w-3.5 shrink-0 text-muted" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block text-[0.6rem] font-semibold tracking-[0.08em] text-ice uppercase">
          Dungeon audio
        </span>
        <span className="block text-[0.55rem] text-muted">
          {isOn ? "Ambience online" : "Muted"}
        </span>
      </span>
      <span
        className={cn(
          "relative h-4 w-7 shrink-0 border transition-colors",
          isOn
            ? "border-[rgba(84,221,255,0.5)] bg-[rgba(59,158,255,0.28)]"
            : "border-[rgba(84,221,255,0.18)] bg-[rgba(2,8,16,0.8)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-2.5 w-2.5 transition-all",
            isOn
              ? "left-[13px] bg-glow shadow-[0_0_6px_#54ddff]"
              : "left-0.5 bg-muted",
          )}
        />
      </span>
    </button>
  );
}
