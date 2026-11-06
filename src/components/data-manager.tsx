"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  RotateCcw,
  ShieldAlert,
  Upload,
} from "lucide-react";
import { resetProgress } from "@/app/actions";
import { cn } from "@/lib/utils";
import { SystemPanel } from "./system-panel";
import { SystemToast, type ToastState } from "./system-toast";

export function DataManager() {
  const [toast, setToast] = useState<ToastState | null>(null);
  const [importing, setImporting] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function importBackup(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.set("file", file);
      const response = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });
      const result = (await response.json()) as {
        ok?: boolean;
        error?: string;
      };

      if (!response.ok || !result.ok) {
        setToast({
          title: "Restore failed",
          message: result.error ?? "The backup could not be restored.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setToast({
        title: "Backup restored",
        message: "The System has synchronized with the archived record.",
        tone: "success",
      });
    } catch {
      setToast({
        title: "Restore failed",
        message: "Could not reach the System. Try again.",
        tone: "danger",
      });
    } finally {
      setImporting(false);
    }
  }

  function reset() {
    if (
      !window.confirm(
        "Reset all progress? Sessions, quest claims, achievements, and XP will be erased. This cannot be undone.",
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await resetProgress();

      if (!result.ok) {
        setToast({
          title: "Reset failed",
          message: result.error ?? "Could not reset progress.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setToast({
        title: "System reset",
        message: "The record has been cleared. Your subjects remain.",
        tone: "system",
      });
    });
  }

  return (
    <>
      <SystemPanel label="Data vault" className="boot-in boot-in-delay-2">
        <p className="text-xs leading-relaxed text-muted">
          Your data never leaves this device. Export a JSON backup before
          resetting or moving to another machine.
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <a
            href="/api/export"
            className="system-button system-button--small justify-center"
            download
          >
            <Download className="h-3.5 w-3.5" /> Export backup
          </a>
          <a
            href="/api/export/csv"
            className="system-button system-button--small justify-center"
            download
          >
            <Download className="h-3.5 w-3.5" /> Export CSV
          </a>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="system-button system-button--small justify-center"
            disabled={importing}
          >
            <Upload className="h-3.5 w-3.5" />
            {importing ? "Restoring..." : "Restore backup"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={importBackup}
            className="sr-only"
            aria-label="Choose backup file"
          />
        </div>

        <div className="mt-4 border border-[rgb(var(--danger-rgb)/0.2)] bg-[rgb(var(--danger-rgb)/0.04)] p-3">
          <div className="flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-danger" />
            <p className="hud-label text-danger">Danger zone</p>
          </div>
          <p className="mt-1.5 text-[0.65rem] leading-relaxed text-muted">
            Reset progress erases sessions, quest rewards, achievements, and XP.
            Subjects and settings are kept.
          </p>
          <button
            type="button"
            onClick={reset}
            disabled={isPending}
            className={cn(
              "mt-3 inline-flex h-8 items-center gap-1.5 border border-[rgb(var(--danger-rgb)/0.35)] bg-[rgb(var(--danger-rgb)/0.08)] px-3 text-[0.62rem] font-semibold tracking-[0.12em] text-danger uppercase transition-colors",
              "hover:border-[rgb(var(--danger-rgb)/0.6)] hover:bg-[rgb(var(--danger-rgb)/0.14)] disabled:opacity-50",
            )}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            {isPending ? "Resetting..." : "Reset progress"}
          </button>
        </div>
      </SystemPanel>

      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
