"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence } from "motion/react";
import {
  History,
  Pencil,
  Search,
  SlidersHorizontal,
  Trash2,
} from "lucide-react";
import { deleteSession } from "@/app/actions";
import { addDays } from "@/lib/dates";
import type { SessionData, SubjectData } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { SessionEditDialog } from "./session-edit-dialog";
import { SessionRow } from "./session-row";
import { SystemToast, type ToastState } from "./system-toast";

type Range = "all" | "7" | "30";

export function SessionHistory({
  sessions,
  subjects,
  todayKey,
}: {
  sessions: SessionData[];
  subjects: SubjectData[];
  todayKey: string;
}) {
  const [query, setQuery] = useState("");
  const [subjectId, setSubjectId] = useState<number | "all">("all");
  const [range, setRange] = useState<Range>("all");
  const [toast, setToast] = useState<ToastState | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editing, setEditing] = useState<SessionData | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const cutoff =
    range === "all"
      ? null
      : addDays(todayKey, -(Number(range) - 1));

  const filtered = sessions.filter((session) => {
    if (subjectId !== "all" && session.subjectId !== subjectId) return false;
    if (cutoff && session.studiedAt < cutoff) return false;

    const haystack =
      `${session.topic} ${session.subjectName} ${session.notes}`.toLowerCase();
    return haystack.includes(query.trim().toLowerCase());
  });

  const filteredMinutes = filtered.reduce(
    (sum, session) => sum + session.durationMinutes,
    0,
  );

  function remove(session: SessionData) {
    if (deletingId !== null || isPending) return;
    const confirmed = window.confirm(
      `Delete "${session.topic}" (${session.durationMinutes} min)? The XP from this session will be removed.`,
    );
    if (!confirmed) return;

    setDeletingId(session.id);
    startTransition(async () => {
      const result = await deleteSession(session.id);
      setDeletingId(null);

      if (!result.ok) {
        setToast({
          title: "System warning",
          message: result.error ?? "Could not delete this session.",
          tone: "danger",
        });
        return;
      }

      router.refresh();
      setToast({
        title: "Record erased",
        message: "The session was removed from the System.",
        tone: "system",
      });
    });
  }

  return (
    <>
      <div className="system-panel system-panel--quiet boot-in boot-in-delay-1">
        <span className="panel-corner panel-corner--tl" />
        <span className="panel-corner panel-corner--br" />

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-glow" />
              <h2 className="hud-label hud-label--bright">Session archive</h2>
            </div>
            <p className="mt-1 text-xs text-muted">
              {filtered.length} record{filtered.length === 1 ? "" : "s"} ·{" "}
              {formatNumber(filteredMinutes)} minutes
            </p>
          </div>
          <div className="flex items-center gap-2 text-[0.6rem] tracking-[0.12em] text-muted uppercase">
            <span className="pulse-dot" /> System synced
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
            <input
              className="system-input pl-8 text-sm"
              placeholder="Search topic, subject, notes..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label="Search sessions"
            />
          </div>

          <select
            className="system-select text-sm"
            value={subjectId}
            onChange={(event) =>
              setSubjectId(
                event.target.value === "all"
                  ? "all"
                  : Number(event.target.value),
              )
            }
            aria-label="Filter by subject"
          >
            <option value="all">All subjects</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name}
              </option>
            ))}
          </select>

          <select
            className="system-select text-sm"
            value={range}
            onChange={(event) => setRange(event.target.value as Range)}
            aria-label="Filter by date"
          >
            <option value="all">All time</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
          </select>
        </div>

        <div className="mt-3">
          {filtered.length > 0 ? (
            <AnimatePresence initial={false}>
              {filtered.map((session, index) => (
              <SessionRow
                key={session.id}
                session={session}
                index={index}
                actions={
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditing(session)}
                      className={cn(
                        "icon-button h-7 w-7 border-[rgba(84,221,255,0.1)]",
                        "hover:border-[rgba(84,221,255,0.45)] hover:text-glow",
                      )}
                      aria-label={`Edit ${session.topic}`}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(session)}
                      disabled={deletingId === session.id}
                      className={cn(
                        "icon-button h-7 w-7 border-[rgba(84,221,255,0.1)]",
                        "hover:border-[rgba(255,84,104,0.5)] hover:text-[#ffadb8]",
                      )}
                      aria-label={`Delete ${session.topic}`}
                    >
                      {deletingId === session.id ? (
                        <span className="h-3 w-3 animate-spin rounded-full border border-muted border-t-transparent" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                }
              />
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex min-h-64 flex-col items-center justify-center text-center">
              <div className="grid h-12 w-12 place-items-center border border-[rgba(84,221,255,0.16)] bg-[rgba(59,158,255,0.04)]">
                <SlidersHorizontal className="h-5 w-5 text-muted" />
              </div>
              <p className="mt-4 font-display text-lg text-ice">
                No matching records
              </p>
              <p className="mt-1 max-w-xs text-xs text-muted">
                Adjust the filters or record a new session to add data to the
                archive.
              </p>
            </div>
          )}
        </div>

        {filtered.length > 0 ? (
          <p className="mt-3 border-t border-[rgba(84,221,255,0.08)] pt-3 text-right font-mono text-[0.58rem] text-muted">
            Showing {filtered.length} of {sessions.length} total records
          </p>
        ) : null}
      </div>

      <AnimatePresence>
        {editing ? (
          <SessionEditDialog
            key="session-edit"
            session={editing}
            subjects={subjects}
            todayKey={todayKey}
            onClose={() => setEditing(null)}
            onSaved={(message) =>
              setToast({
                title: "Record updated",
                message,
                tone: "success",
              })
            }
          />
        ) : null}
      </AnimatePresence>

      <SystemToast toast={toast} onClose={() => setToast(null)} />
    </>
  );
}
