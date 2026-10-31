import {
  Brain,
  Clock,
  Compass,
  Crown,
  Flame,
  Layers,
  Medal,
  Shield,
  Sparkles,
  Swords,
  Target,
  Timer,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  sparkles: Sparkles,
  clock: Clock,
  timer: Timer,
  layers: Layers,
  flame: Flame,
  crown: Crown,
  target: Target,
  compass: Compass,
  trophy: Trophy,
  medal: Medal,
  swords: Swords,
  brain: Brain,
  shield: Shield,
  zap: Zap,
};

export function SystemIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = iconMap[name] ?? Sparkles;
  return <Icon className={className} aria-hidden="true" />;
}
