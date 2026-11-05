"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  playSystemSound,
  setGlobalSoundEnabled,
  type SoundEffectType,
} from "@/lib/sound";

interface SoundContextValue {
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playSound: (type: SoundEffectType, options?: { force?: boolean }) => void;
}

const SoundContext = createContext<SoundContextValue>({
  soundEnabled: true,
  setSoundEnabled: () => {},
  playSound: () => {},
});

export function SoundProvider({
  initialSoundEnabled = true,
  children,
}: {
  initialSoundEnabled?: boolean;
  children: ReactNode;
}) {
  const [soundEnabled, setSoundEnabledState] = useState(initialSoundEnabled);

  useEffect(() => {
    setGlobalSoundEnabled(initialSoundEnabled);
  }, [initialSoundEnabled]);

  const setSoundEnabled = useCallback((enabled: boolean) => {
    setSoundEnabledState(enabled);
    setGlobalSoundEnabled(enabled);
  }, []);

  const playSound = useCallback(
    (type: SoundEffectType, options?: { force?: boolean }) => {
      playSystemSound(type, options);
    },
    [],
  );

  return (
    <SoundContext.Provider
      value={{
        soundEnabled,
        setSoundEnabled,
        playSound,
      }}
    >
      {children}
    </SoundContext.Provider>
  );
}

export function useSound() {
  return useContext(SoundContext);
}
