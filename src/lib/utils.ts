export function cn(
  ...classes: Array<string | false | null | undefined>
): string {
  return classes.filter(Boolean).join(" ");
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function focusLabel(value: number): string {
  const labels: Record<number, string> = {
    1: "Scattered",
    2: "Light",
    3: "Steady",
    4: "Focused",
    5: "Monarch",
  };
  return labels[value] ?? "Steady";
}

export function focusTone(value: number): string {
  if (value >= 5) return "text-danger";
  if (value >= 4) return "text-system";
  if (value >= 3) return "text-mint";
  return "text-mist";
}

export function metricLabel(metric: string, target: number): string {
  switch (metric) {
    case "minutes":
      return `${target} minutes`;
    case "sessions":
      return `${target} session${target === 1 ? "" : "s"}`;
    case "reflections":
      return `${target} reflection${target === 1 ? "" : "s"}`;
    case "days":
      return `${target} day${target === 1 ? "" : "s"}`;
    default:
      return `${target}`;
  }
}

export function progressUnit(metric: string, value: number): string {
  const rounded = Math.round(value);
  switch (metric) {
    case "minutes":
      return `${rounded}m`;
    case "sessions":
      return `${rounded} session${rounded === 1 ? "" : "s"}`;
    case "reflections":
      return `${rounded} reflection${rounded === 1 ? "" : "s"}`;
    case "days":
      return `${rounded} day${rounded === 1 ? "" : "s"}`;
    default:
      return `${rounded}`;
  }
}
