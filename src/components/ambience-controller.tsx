"use client";

import { useEffect } from "react";
import { useSfx } from "./sound-provider";

export function AmbienceController() {
  const { enabled, startAmbience } = useSfx();

  useEffect(() => {
    if (!enabled) return;
    startAmbience("ambience.dungeon", { force: true });
  }, [enabled, startAmbience]);

  return null;
}
