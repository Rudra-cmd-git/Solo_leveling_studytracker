"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { SFX, type SfxKey } from "@/lib/sfx";

interface PlayOptions {
  volume?: number;
  rate?: number;
  delayMs?: number;
  force?: boolean;
}

interface AmbienceOptions {
  volume?: number;
  force?: boolean;
}

interface SoundContextValue {
  enabled: boolean;
  play: (key: SfxKey, options?: PlayOptions) => void;
  playSequence: (
    cues: { key: SfxKey; delayMs?: number; volume?: number }[],
    options?: { force?: boolean; volume?: number },
  ) => void;
  startAmbience: (key: SfxKey, options?: AmbienceOptions) => void;
  stopAmbience: () => void;
  ambienceKey: SfxKey | null;
}

const SoundContext = createContext<SoundContextValue | null>(null);

type AudioWindow = Window &
  typeof globalThis & {
    webkitAudioContext?: typeof AudioContext;
  };

export function SoundProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) {
  const [ambienceKey, setAmbienceKey] = useState<SfxKey | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const bufferCacheRef = useRef<Map<string, Promise<AudioBuffer>>>(new Map());
  const ambienceRef = useRef<{
    source: AudioBufferSourceNode;
    gain: GainNode;
  } | null>(null);
  const ambienceTokenRef = useRef(0);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === "undefined") return null;

    if (!contextRef.current) {
      const AudioContextClass =
        window.AudioContext ?? (window as AudioWindow).webkitAudioContext;
      if (!AudioContextClass) return null;

      const context = new AudioContextClass();
      const master = context.createGain();
      master.gain.value = 0.9;
      master.connect(context.destination);
      contextRef.current = context;
      masterRef.current = master;
    }

    if (contextRef.current.state === "suspended") {
      void contextRef.current.resume().catch(() => {
        // The next user gesture will retry the unlock.
      });
    }

    return contextRef.current;
  }, []);

  const loadBuffer = useCallback(
    (key: SfxKey): Promise<AudioBuffer> => {
      const definition = SFX[key];
      const cached = bufferCacheRef.current.get(definition.src);
      if (cached) return cached;

      const context = getContext();
      if (!context) return Promise.reject(new Error("Audio unavailable."));

      const promise = fetch(definition.src)
        .then((response) => {
          if (!response.ok) {
            throw new Error(`Could not load sound: ${definition.src}`);
          }
          return response.arrayBuffer();
        })
        .then((data) => context.decodeAudioData(data));

      bufferCacheRef.current.set(definition.src, promise);
      promise.catch(() => bufferCacheRef.current.delete(definition.src));
      return promise;
    },
    [getContext],
  );

  const play = useCallback(
    (key: SfxKey, options: PlayOptions = {}) => {
      if (!options.force && !enabledRef.current) return;

      const context = getContext();
      const master = masterRef.current;
      if (!context || !master) return;

      const definition = SFX[key];

      void loadBuffer(key)
        .then((buffer) => {
          if (!options.force && !enabledRef.current) return;

          const source = context.createBufferSource();
          const gain = context.createGain();
          const startAt =
            context.currentTime + Math.max(0, options.delayMs ?? 0) / 1000;
          const level = Math.max(
            0.0001,
            definition.volume * (options.volume ?? 1),
          );

          source.buffer = buffer;
          source.playbackRate.value = options.rate ?? 1;
          gain.gain.setValueAtTime(0.0001, startAt);
          gain.gain.exponentialRampToValueAtTime(level, startAt + 0.012);
          source.connect(gain);
          gain.connect(master);
          source.onended = () => {
            source.disconnect();
            gain.disconnect();
          };
          source.start(startAt);
        })
        .catch(() => {
          // Audio is optional; the visual System feedback still fires.
        });
    },
    [getContext, loadBuffer],
  );

  const playSequence = useCallback(
    (
      cues: { key: SfxKey; delayMs?: number; volume?: number }[],
      options: { force?: boolean; volume?: number } = {},
    ) => {
      for (const cue of cues) {
        play(cue.key, {
          delayMs: cue.delayMs,
          volume: (cue.volume ?? 1) * (options.volume ?? 1),
          force: options.force,
        });
      }
    },
    [play],
  );

  const haltAmbience = useCallback(() => {
    ambienceTokenRef.current += 1;
    const current = ambienceRef.current;
    ambienceRef.current = null;

    if (!current) return;

    const context = contextRef.current;
    if (context && context.state !== "closed") {
      const now = context.currentTime;
      current.gain.gain.cancelScheduledValues(now);
      current.gain.gain.setValueAtTime(
        Math.max(0.0001, current.gain.gain.value),
        now,
      );
      current.gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.8);
      try {
        current.source.stop(now + 0.9);
      } catch {
        // The source may already have ended.
      }
    } else {
      try {
        current.source.stop();
      } catch {
        // The source may already have ended.
      }
    }
  }, []);

  const stopAmbience = useCallback(() => {
    haltAmbience();
    setAmbienceKey(null);
  }, [haltAmbience]);

  const startAmbience = useCallback(
    (key: SfxKey, options: AmbienceOptions = {}) => {
      if (!options.force && !enabledRef.current) return;

      const context = getContext();
      const master = masterRef.current;
      if (!context || !master) return;

      haltAmbience();
      const token = ambienceTokenRef.current;
      const definition = SFX[key];

      void loadBuffer(key)
        .then((buffer) => {
          if (token !== ambienceTokenRef.current) return;
          if (!options.force && !enabledRef.current) return;

          const source = context.createBufferSource();
          const gain = context.createGain();
          const now = context.currentTime;
          const level = Math.max(
            0.0001,
            definition.volume * (options.volume ?? 1),
          );

          source.buffer = buffer;
          source.loop = true;
          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.exponentialRampToValueAtTime(level, now + 2.4);
          source.connect(gain);
          gain.connect(master);
          source.start();

          ambienceRef.current = { source, gain };
          setAmbienceKey(key);
        })
        .catch(() => {
          // The ambience bed is optional.
        });
    },
    [getContext, haltAmbience, loadBuffer],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const unlock = () => {
      void getContext();
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };

    window.addEventListener("pointerdown", unlock, true);
    window.addEventListener("keydown", unlock, true);

    return () => {
      window.removeEventListener("pointerdown", unlock, true);
      window.removeEventListener("keydown", unlock, true);
    };
  }, [getContext]);

  useEffect(() => {
    let lastClickAt = 0;

    const handleClick = (event: MouseEvent) => {
      if (!event.isTrusted || event.button !== 0) return;

      const target = event.target;
      if (!(target instanceof Element)) return;

      const control = target.closest<HTMLElement>(
        'a[href], button:not([disabled]), [role="button"], input[type="submit"], input[type="button"], summary',
      );
      if (!control) return;
      if (control.closest("[data-sfx-silent]")) return;
      if (control.getAttribute("aria-disabled") === "true") return;

      const now = performance.now();
      if (now - lastClickAt < 70) return;
      lastClickAt = now;
      play("ui.click");
    };

    document.addEventListener("click", handleClick, true);
    return () => document.removeEventListener("click", handleClick, true);
  }, [play]);

  useEffect(() => {
    const bufferCache = bufferCacheRef.current;
    return () => {
      stopAmbience();
      const context = contextRef.current;
      contextRef.current = null;
      masterRef.current = null;
      bufferCache.clear();
      if (context && context.state !== "closed") {
        void context.close().catch(() => {
          // The context may already be closing.
        });
      }
    };
  }, [stopAmbience]);

  return (
    <SoundContext.Provider
      value={{
        enabled,
        play,
        playSequence,
        startAmbience,
        stopAmbience,
        ambienceKey,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSfx(): SoundContextValue {
  const value = useContext(SoundContext);
  if (!value) {
    throw new Error("useSfx must be used inside a SoundProvider.");
  }
  return value;
}
