export type SfxCategory = "ui" | "focus" | "reward" | "ambience";

export type SfxKey =
  | "ui.click"
  | "ui.confirm"
  | "ui.error"
  | "ui.modal"
  | "system.boot"
  | "timer.start"
  | "timer.pause"
  | "timer.heartbeat"
  | "timer.complete"
  | "reward.crystal"
  | "reward.levelUp"
  | "reward.impact"
  | "reward.choir"
  | "reward.drums"
  | "reward.achievement"
  | "quest.complete"
  | "streak.break"
  | "ambience.dungeon"
  | "ambience.drone";

export interface SfxDefinition {
  label: string;
  description: string;
  src: string;
  category: SfxCategory;
  volume: number;
  loop?: boolean;
  source: {
    title: string;
    page: string;
    license: string;
    licenseUrl: string;
  };
}

const MIXKIT_LICENSE = {
  license: "Mixkit Sound Effects Free License",
  licenseUrl: "https://mixkit.co/license/#sfxFree",
} as const;

export const SFX: Record<SfxKey, SfxDefinition> = {
  "ui.click": {
    label: "System click",
    description: "Short metallic tick for buttons and navigation.",
    src: "/audio/sfx/ui-click.mp3",
    category: "ui",
    volume: 0.32,
    source: {
      title: "Sci fi click",
      page: "https://mixkit.co/free-sound-effects/sci-fi/",
      ...MIXKIT_LICENSE,
    },
  },
  "ui.confirm": {
    label: "Confirm",
    description: "Positive Sci-Fi confirmation for saved settings and accepted actions.",
    src: "/audio/sfx/ui-confirm.mp3",
    category: "ui",
    volume: 0.55,
    source: {
      title: "Sci Fi confirmation",
      page: "https://mixkit.co/free-sound-effects/sci-fi/",
      ...MIXKIT_LICENSE,
    },
  },
  "ui.error": {
    label: "Reject",
    description: "Dissonant notification for invalid input and failed actions.",
    src: "/audio/sfx/ui-error.mp3",
    category: "ui",
    volume: 0.6,
    source: {
      title: "Sci-Fi reject notification",
      page: "https://mixkit.co/free-sound-effects/sci-fi/",
      ...MIXKIT_LICENSE,
    },
  },
  "ui.modal": {
    label: "Panel open",
    description: "Soft mechanical opening for dialogs and System panels.",
    src: "/audio/sfx/ui-modal.mp3",
    category: "ui",
    volume: 0.5,
    source: {
      title: "Opening software interface",
      page: "https://mixkit.co/free-sound-effects/interface/",
      ...MIXKIT_LICENSE,
    },
  },
  "system.boot": {
    label: "System boot",
    description: "Machine activation for onboarding and entering the focus gate.",
    src: "/audio/sfx/system-boot.mp3",
    category: "ui",
    volume: 0.65,
    source: {
      title: "Machine activation short",
      page: "https://mixkit.co/free-sound-effects/sci-fi/",
      ...MIXKIT_LICENSE,
    },
  },
  "timer.start": {
    label: "Gate opens",
    description: "Dark sweep as a focus session begins.",
    src: "/audio/sfx/timer-start.mp3",
    category: "focus",
    volume: 0.7,
    source: {
      title: "Terror sweep of darkness",
      page: "https://mixkit.co/free-sound-effects/horror/",
      ...MIXKIT_LICENSE,
    },
  },
  "timer.pause": {
    label: "Gate closes",
    description: "Reverberant whoosh for pausing or resuming a session.",
    src: "/audio/sfx/timer-pause.mp3",
    category: "focus",
    volume: 0.5,
    source: {
      title: "Cinematic tunnel reverb woosh",
      page: "https://mixkit.co/free-sound-effects/whoosh/",
      ...MIXKIT_LICENSE,
    },
  },
  "timer.heartbeat": {
    label: "Final heartbeats",
    description: "Deep drum pulse for the last seconds of a focus session.",
    src: "/audio/sfx/timer-heartbeat.mp3",
    category: "focus",
    volume: 0.55,
    source: {
      title: "Horror deep drum heartbeat",
      page: "https://mixkit.co/free-sound-effects/horror/",
      ...MIXKIT_LICENSE,
    },
  },
  "timer.complete": {
    label: "Timer complete",
    description: "System notification when the focus timer ends.",
    src: "/audio/sfx/timer-complete.mp3",
    category: "focus",
    volume: 0.7,
    source: {
      title: "Sci Fi positive notification",
      page: "https://mixkit.co/free-sound-effects/sci-fi/",
      ...MIXKIT_LICENSE,
    },
  },
  "reward.crystal": {
    label: "Crystal shimmer",
    description: "Glassy chime layer for the System's reward feedback.",
    src: "/audio/sfx/reward-crystal.mp3",
    category: "reward",
    volume: 0.45,
    source: {
      title: "Crystal chime",
      page: "https://mixkit.co/free-sound-effects/sci-fi/",
      ...MIXKIT_LICENSE,
    },
  },
  "reward.levelUp": {
    label: "Level up",
    description: "Rising game notification for a new Hunter level.",
    src: "/audio/sfx/reward-level-up.mp3",
    category: "reward",
    volume: 0.7,
    source: {
      title: "Game experience level increased",
      page: "https://mixkit.co/free-sound-effects/game/",
      ...MIXKIT_LICENSE,
    },
  },
  "reward.impact": {
    label: "Rank-up impact",
    description: "Heavy sub hit for a rank promotion.",
    src: "/audio/sfx/reward-impact.mp3",
    category: "reward",
    volume: 0.75,
    source: {
      title: "Hard horror hit drum",
      page: "https://mixkit.co/free-sound-effects/horror/",
      ...MIXKIT_LICENSE,
    },
  },
  "reward.choir": {
    label: "Dark choir",
    description: "Ominous choir swell layered into rank-up.",
    src: "/audio/sfx/reward-choir.mp3",
    category: "reward",
    volume: 0.5,
    source: {
      title: "Cinematic dark choir transition",
      page: "https://mixkit.co/free-sound-effects/dark/",
      ...MIXKIT_LICENSE,
    },
  },
  "reward.drums": {
    label: "War drums",
    description: "Distant drums that give rank-up its dungeon weight.",
    src: "/audio/sfx/reward-drums.mp3",
    category: "reward",
    volume: 0.5,
    source: {
      title: "Ominous drums",
      page: "https://mixkit.co/free-sound-effects/game/",
      ...MIXKIT_LICENSE,
    },
  },
  "reward.achievement": {
    label: "Achievement",
    description: "Magic trophy sweep for an unlocked achievement.",
    src: "/audio/sfx/reward-achievement.mp3",
    category: "reward",
    volume: 0.62,
    source: {
      title: "Magic sweep game trophy",
      page: "https://mixkit.co/free-sound-effects/game/",
      ...MIXKIT_LICENSE,
    },
  },
  "quest.complete": {
    label: "Quest cleared",
    description: "Level-complete sting for claimed quests.",
    src: "/audio/sfx/quest-complete.mp3",
    category: "reward",
    volume: 0.68,
    source: {
      title: "Game level completed",
      page: "https://mixkit.co/free-sound-effects/game/",
      ...MIXKIT_LICENSE,
    },
  },
  "streak.break": {
    label: "Streak broken",
    description: "Dark orchestral failure cue for a broken streak.",
    src: "/audio/sfx/streak-break.mp3",
    category: "reward",
    volume: 0.55,
    source: {
      title: "Game over dark orchestra",
      page: "https://mixkit.co/free-sound-effects/dark/",
      ...MIXKIT_LICENSE,
    },
  },
  "ambience.dungeon": {
    label: "Dungeon ambience",
    description: "Cavernous wind and low rumble for the dungeon atmosphere.",
    src: "/audio/ambience/dungeon-ambience.mp3",
    category: "ambience",
    volume: 0.34,
    loop: true,
    source: {
      title: "Horror ambience",
      page: "https://mixkit.co/free-sound-effects/horror/",
      ...MIXKIT_LICENSE,
    },
  },
  "ambience.drone": {
    label: "Tactical drone",
    description: "Steady Sci-Fi drone for a colder System atmosphere.",
    src: "/audio/ambience/tactical-drone.mp3",
    category: "ambience",
    volume: 0.3,
    loop: true,
    source: {
      title: "Tactical drone ambience",
      page: "https://mixkit.co/free-sound-effects/ambience/",
      ...MIXKIT_LICENSE,
    },
  },
};

export const SFX_CATEGORIES: {
  id: SfxCategory;
  label: string;
  korean: string;
  description: string;
}[] = [
  {
    id: "ui",
    label: "System interface",
    korean: "인터페이스",
    description: "Clicks, confirms, warnings, and panel movement.",
  },
  {
    id: "focus",
    label: "Focus gate",
    korean: "집중",
    description: "Session starts, pauses, countdown heartbeats, and completion.",
  },
  {
    id: "reward",
    label: "Rewards",
    korean: "보상",
    description: "Levels, ranks, achievements, quests, and failure states.",
  },
  {
    id: "ambience",
    label: "Dungeon atmosphere",
    korean: "환경",
    description: "Looping background beds for the dungeon mood.",
  },
];

export interface SfxCombo {
  id: string;
  label: string;
  description: string;
  cues: { key: SfxKey; delayMs?: number; volume?: number }[];
}

export const SFX_COMBOS: SfxCombo[] = [
  {
    id: "timer-complete",
    label: "Timer complete",
    description: "System notification plus crystal shimmer.",
    cues: [{ key: "timer.complete" }, { key: "reward.crystal", delayMs: 70 }],
  },
  {
    id: "level-up",
    label: "Level up",
    description: "Rising level cue plus crystal shimmer.",
    cues: [{ key: "reward.levelUp" }, { key: "reward.crystal", delayMs: 90 }],
  },
  {
    id: "rank-up",
    label: "Rank up",
    description: "Sub hit, dark choir, and war drums.",
    cues: [
      { key: "reward.impact" },
      { key: "reward.choir", delayMs: 90 },
      { key: "reward.drums", delayMs: 180 },
    ],
  },
];
