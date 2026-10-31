"use client";

import { useEffect } from "react";
import { AlertTriangle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastTone = "system" | "success" | "danger";

export interface ToastState {
  title: string;
  message: string;
  tone?: ToastTone;
}

const toneStyles: Record<ToastTone, string> = {
  system: "border-[rgba(84,221,255,0.38)]",
  success: "border-[rgba(61,214,163,0.42)]",
  danger: "border-[rgba(255,84,104,0.45)]",
};

const toneText: Record<ToastTone, string> = {
  system: "text-glow",
  success: "text-mint",
  danger: "text-danger",
};

export function SystemToast({
  toast,
  onClose,
}: {
  toast: ToastState | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onClose, 4600);
    return () => window.clearTimeout(timer);
  }, [toast, onClose]);

  if (!toast) return null;

  const tone = toast.tone ?? "system";
  const Icon =
    tone === "success"
      ? CheckCircle2
      : tone === "danger"
        ? AlertTriangle
        : Info;

  return (
    <div className="pointer-events-none fixed inset-x-4 bottom-24 z-50 flex justify-center lg:bottom-8 lg:left-auto lg:right-8 lg:justify-end">
      <div
        className={cn(
          "system-toast pointer-events-auto flex w-full max-w-sm items-start gap-3 p-3.5",
          toneStyles[tone],
        )}
        role="status"
      >
        <Icon className={cn("mt-0.5 h-4.5 w-4.5 shrink-0", toneText[tone])} />
        <div className="min-w-0 flex-1">
          <p className="hud-label">{toast.title}</p>
          <p className="mt-1 text-sm leading-snug text-ice">{toast.message}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-muted transition-colors hover:text-white"
          aria-label="Dismiss notification"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
