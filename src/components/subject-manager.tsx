"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { addSubject, deleteSubject } from "@/app/actions";
import type { SubjectData } from "@/lib/types";
import { cn } from "@/lib/utils";
import { SystemPanel } from "./system-panel";
import { SystemToast, type ToastState } from "./system-toast";

const PALETTE = [
  "#43a9ff",
  "#3dd6a3",
  "#8c7dff",
  "#ffb84d",
  "#ff5b72",
  "#54ddff",
  "#d78bff",
  "#a3e635",
];

export function SubjectManager({
  subjects,
  usage,
}: {
  subjects: SubjectData[];
  usage: Record<number, number>;
}) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(PALETTE[0]);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPending || !name.trim()) return;

    startTransition(async () => {
      const result = await addSubject(name, color);

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not add subject.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setName("");
      setToast({
        title: "Subject registered",
        message: `${name.trim()} is now available in the focus gate.`,
        tone: "success",
      });
    });
  }

  function remove(subject: SubjectData) {
    const count = usage[subject.id] ?? 0;
    if (count > 0) {
      setToast({
        title: "Cannot remove subject",
        message: `${subject.name} has ${count} recorded session${count === 1 ? "" : "s"}.`,
        tone: "danger",
      });
      return;
    }

    if (!window.confirm(`Delete the subject "${subject.name}"?`)) return;

    setDeletingId(subject.id);
    startTransition(async () => {
      const result = await deleteSubject(subject.id);
      setDeletingId(null);

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not delete subject.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setToast({
        title: "Subject removed",
        message: `${subject.name} was removed from the System.`,
        tone: "system",
      });
    });
  }

  return (
    <>
      <SystemPanel label="Subjects" className="boot-in boot-in-delay-1">
        <div className="space-y-2">
          {subjects.map((subject) => {
            const count = usage[subject.id] ?? 0;
            return (
              <div
                key={subject.id}
                className="flex items-center gap-2.5 border border-[rgba(84,221,255,0.1)] bg-[rgba(3,10,20,0.38)] px-3 py-2.5"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rotate-45"
                  style={{
                    backgroundColor: subject.color,
                    boxShadow: `0 0 7px ${subject.color}88`,
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold text-ice">
                  {subject.name}
                </span>
                <span className="font-mono text-[0.55rem] text-muted">
                  {count} session{count === 1 ? "" : "s"}
                </span>
                <button
                  type="button"
                  onClick={() => remove(subject)}
                  disabled={deletingId === subject.id || isPending}
                  className={cn(
                    "icon-button h-7 w-7 border-[rgba(84,221,255,0.1)]",
                    count === 0
                      ? "hover:border-[rgba(255,84,104,0.5)] hover:text-[#ffadb8]"
                      : "opacity-40",
                  )}
                  aria-label={`Delete ${subject.name}`}
                  title={
                    count > 0
                      ? "Subjects with sessions cannot be deleted"
                      : "Delete subject"
                  }
                >
                  {deletingId === subject.id ? (
                    <span className="h-3 w-3 animate-spin rounded-full border border-muted border-t-transparent" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <form onSubmit={add} className="mt-4 border-t border-[rgba(84,221,255,0.1)] pt-4">
          <label htmlFor="new-subject" className="hud-label mb-1.5 block">
            New subject
          </label>
          <div className="flex gap-2">
            <input
              id="new-subject"
              className="system-input text-sm"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Add a discipline..."
              maxLength={30}
            />
            <button
              type="submit"
              className="system-button system-button--small shrink-0"
              disabled={isPending || !name.trim()}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {PALETTE.map((swatch) => (
              <button
                key={swatch}
                type="button"
                onClick={() => setColor(swatch)}
                className={cn(
                  "h-5 w-5 border transition-transform",
                  color === swatch
                    ? "scale-110 border-white/70"
                    : "border-transparent opacity-60 hover:opacity-100",
                )}
                style={{
                  backgroundColor: swatch,
                  boxShadow:
                    color === swatch ? `0 0 8px ${swatch}88` : undefined,
                }}
                aria-label={`Choose color ${swatch}`}
                aria-pressed={color === swatch}
              />
            ))}
          </div>
        </form>
      </SystemPanel>

      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
