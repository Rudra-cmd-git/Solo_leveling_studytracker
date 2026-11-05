type ConfettiFn = typeof import("canvas-confetti");

async function loadConfetti(): Promise<ConfettiFn | null> {
  if (typeof window === "undefined") return null;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return null;
  const loaded = (await import("canvas-confetti")) as unknown as {
    default?: ConfettiFn;
  };
  return loaded.default ?? (loaded as unknown as ConfettiFn);
}

export async function fireRewardConfetti({
  rankedUp = false,
}: {
  rankedUp?: boolean;
}) {
  const confetti = await loadConfetti();
  if (!confetti) return;

  const colors = rankedUp
    ? ["#ffbf5a", "#ffd98a", "#fff3d0", "#54ddff", "#8be9ff"]
    : ["#54ddff", "#8be9ff", "#3b9eff", "#aeeaff"];

  confetti({
    particleCount: rankedUp ? 110 : 60,
    spread: 80,
    startVelocity: rankedUp ? 52 : 42,
    scalar: rankedUp ? 1.1 : 0.9,
    origin: { y: 0.45 },
    colors,
    zIndex: 120,
    disableForReducedMotion: true,
  });

  if (!rankedUp) return;

  window.setTimeout(() => {
    confetti({
      particleCount: 70,
      angle: 60,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.12, y: 0.7 },
      colors,
      zIndex: 120,
      disableForReducedMotion: true,
    });
  }, 140);

  window.setTimeout(() => {
    confetti({
      particleCount: 70,
      angle: 120,
      spread: 90,
      startVelocity: 45,
      origin: { x: 0.88, y: 0.7 },
      colors,
      zIndex: 120,
      disableForReducedMotion: true,
    });
  }, 220);
}

export async function fireQuestConfetti() {
  const confetti = await loadConfetti();
  if (!confetti) return;

  confetti({
    particleCount: 32,
    spread: 55,
    startVelocity: 26,
    scalar: 0.72,
    gravity: 0.9,
    origin: { y: 0.62 },
    colors: ["#3dd6a3", "#8ff0ca", "#ffbf5a", "#54ddff"],
    zIndex: 120,
    disableForReducedMotion: true,
  });
}
