"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

type CountFormat = "number" | "minutes" | "hours" | "decimal";

interface CountUpProps {
  value: number;
  format?: CountFormat;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  duration?: number;
}

function formatValue(value: number, format: CountFormat, decimals: number) {
  if (format === "minutes") {
    const rounded = Math.max(0, Math.round(value));
    const hours = Math.floor(rounded / 60);
    const rest = rounded % 60;
    if (hours === 0) return `${rest}m`;
    if (rest === 0) return `${hours}h`;
    return `${hours}h ${rest}m`;
  }

  if (format === "hours") {
    const hours = Math.max(0, value);
    return hours >= 10 ? `${Math.round(hours)}h` : `${hours.toFixed(1)}h`;
  }

  if (format === "decimal") {
    return value.toFixed(decimals);
  }

  return new Intl.NumberFormat("en-US").format(Math.round(value));
}

export function CountUp({
  value,
  format = "number",
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
  duration = 1.1,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const fromRef = useRef(0);
  const [animated, setAnimated] = useState(value);
  const display = reduceMotion ? value : animated;

  useEffect(() => {
    if (reduceMotion || !inView) return;

    const from = fromRef.current;
    const controls = animate(from, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => {
        fromRef.current = latest;
        setAnimated(latest);
      },
    });

    return () => controls.stop();
  }, [value, inView, reduceMotion, duration]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatValue(display, format, decimals)}
      {suffix}
    </span>
  );
}
