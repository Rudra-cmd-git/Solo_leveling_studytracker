"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  Layers,
  Play,
  Square,
  Volume2,
  Waves,
} from "lucide-react";
import {
  SFX,
  SFX_CATEGORIES,
  SFX_COMBOS,
  type SfxCategory,
  type SfxDefinition,
  type SfxKey,
} from "@/lib/sfx";
import { cn } from "@/lib/utils";
import { PageHeader } from "./page-header";
import { useSfx } from "./sound-provider";
import { SystemPanel } from "./system-panel";

function cuesFor(category: SfxCategory): [SfxKey, SfxDefinition][] {
  return Object.entries(SFX).filter(
    ([, definition]) => definition.category === category,
  ) as [SfxKey, SfxDefinition][];
}

export function SoundLab() {
  const { enabled, play, playSequence, startAmbience, stopAmbience, ambienceKey } =
    useSfx();
  const [volume, setVolume] = useState(80);
  const [lastPlayed, setLastPlayed] = useState<string | null>(null);
  const flashTimer = useRef<number | null>(null);

  function flash(id: string) {
    setLastPlayed(id);
    if (flashTimer.current) window.clearTimeout(flashTimer.current);
    flashTimer.current = window.setTimeout(() => {
      setLastPlayed(null);
      flashTimer.current = null;
    }, 700);
  }

  function playCue(key: SfxKey) {
    play(key, { force: true, volume: volume / 100 });
    flash(key);
  }

  function playCombo(id: string) {
    const combo = SFX_COMBOS.find((entry) => entry.id === id);
    if (!combo) return;
    playSequence(combo.cues, { force: true, volume: volume / 100 });
    flash(combo.id);
  }

  function toggleAmbience(key: SfxKey) {
    if (ambienceKey === key) {
      stopAmbience();
      return;
    }
    startAmbience(key, { force: true, volume: volume / 100 });
    flash(key);
  }

  return (
    <div className="space-y-5 sm:space-y-6" data-sfx-silent>
      <PageHeader
        eyebrow="System // Audio calibration"
        korean="사운드"
        title="Sound Lab"
        description="Audition every dungeon cue before it is wired into the System. Nothing here changes your saved settings."
        action={
          <Link href="/settings" className="system-button system-button--ghost">
            <ArrowLeft className="h-4 w-4" />
            Settings
          </Link>
        }
      />

      <SystemPanel label="Calibration" className="boot-in boot-in-delay-1">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full max-w-md">
            <div className="mb-2 flex items-center justify-between gap-3">
              <label htmlFor="sound-lab-volume" className="hud-label">
                Preview volume
              </label>
              <span className="font-mono text-xs text-glow">{volume}%</span>
            </div>
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 shrink-0 text-muted" />
              <input
                id="sound-lab-volume"
                type="range"
                min={0}
                max={100}
                value={volume}
                onChange={(event) => setVolume(Number(event.target.value))}
                className="w-full cursor-pointer accent-[#54ddff]"
              />
              <Waves className="h-4 w-4 shrink-0 text-muted" />
            </div>
            <p className="mt-2 text-[0.62rem] leading-relaxed text-muted">
              {enabled
                ? "Master sound is enabled. These previews bypass the gate so you can audition freely."
                : "Master sound is off. Previews still play here; enable Dungeon audio in Settings to use cues across the app."}
            </p>
          </div>

          <button
            type="button"
            onClick={stopAmbience}
            disabled={!ambienceKey}
            className="system-button system-button--ghost system-button--small self-start sm:self-auto"
          >
            <Square className="h-3.5 w-3.5" />
            Stop ambience
          </button>
        </div>
      </SystemPanel>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        {SFX_CATEGORIES.map((category, index) => {
          const cues = cuesFor(category.id);
          return (
            <SystemPanel
              key={category.id}
              label={category.label}
              className={cn("boot-in", `boot-in-delay-${Math.min(index + 1, 4)}`)}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="korean-accent">{category.korean}</span>
                <span className="h-px flex-1 bg-[rgba(84,221,255,0.08)]" />
              </div>
              <p className="mb-3 text-[0.66rem] leading-relaxed text-muted">
                {category.description}
              </p>

              <div className="divide-y divide-[rgba(84,221,255,0.08)]">
                {cues.map(([key, definition]) => {
                  const isAmbience = category.id === "ambience";
                  const isActive = ambienceKey === key;
                  const isFlashing = lastPlayed === key;

                  return (
                    <div
                      key={key}
                      className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
                    >
                      <button
                        type="button"
                        onClick={() =>
                          isAmbience ? toggleAmbience(key) : playCue(key)
                        }
                        aria-label={
                          isAmbience && isActive
                            ? `Stop ${definition.label}`
                            : `Play ${definition.label}`
                        }
                        className={cn(
                          "icon-button h-9 w-9 shrink-0",
                          (isFlashing || isActive) &&
                            "border-[rgba(84,221,255,0.72)] text-glow shadow-[0_0_14px_rgba(84,221,255,0.18)]",
                        )}
                      >
                        {isAmbience && isActive ? (
                          <Square className="h-3.5 w-3.5" />
                        ) : isFlashing ? (
                          <Waves className="h-4 w-4 animate-pulse" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                      </button>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-xs font-semibold text-ice">
                            {definition.label}
                          </p>
                          {isAmbience && isActive ? (
                            <span className="border border-[rgba(84,221,255,0.4)] px-1.5 py-0.5 font-mono text-[0.5rem] tracking-widest text-glow">
                              LIVE
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-0.5 truncate text-[0.62rem] text-muted">
                          {definition.description}
                        </p>
                      </div>

                      <a
                        href={definition.source.page}
                        target="_blank"
                        rel="noreferrer"
                        title={`${definition.source.title} · ${definition.source.license}`}
                        aria-label={`Open source for ${definition.label}`}
                        className="shrink-0 text-muted transition-colors hover:text-glow"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  );
                })}
              </div>
            </SystemPanel>
          );
        })}
      </div>

      <SystemPanel
        label="Layered checks"
        className="boot-in boot-in-delay-4"
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {SFX_COMBOS.map((combo) => (
            <button
              key={combo.id}
              type="button"
              onClick={() => playCombo(combo.id)}
              className={cn(
                "group flex items-start gap-3 border border-[rgba(84,221,255,0.12)] bg-[rgba(3,10,20,0.38)] p-3 text-left transition-colors hover:border-[rgba(84,221,255,0.34)] hover:bg-[rgba(59,158,255,0.06)]",
                lastPlayed === combo.id && "border-[rgba(84,221,255,0.5)]",
              )}
            >
              <span className="icon-button h-9 w-9 shrink-0">
                {lastPlayed === combo.id ? (
                  <Waves className="h-4 w-4 animate-pulse" />
                ) : (
                  <Layers className="h-4 w-4" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-semibold text-ice">
                  {combo.label}
                </span>
                <span className="mt-0.5 block text-[0.62rem] leading-relaxed text-muted">
                  {combo.description}
                </span>
              </span>
            </button>
          ))}
        </div>
        <p className="mt-3 text-[0.62rem] text-muted">
          Each layer is also available individually above. Mixkit previews are
          used under the Mixkit Sound Effects Free License; see{" "}
          <a
            href="/audio/SOURCES.md"
            className="text-glow/80 underline decoration-[rgba(84,221,255,0.3)] underline-offset-2 hover:text-glow"
          >
            audio sources
          </a>
          .
        </p>
      </SystemPanel>
    </div>
  );
}
