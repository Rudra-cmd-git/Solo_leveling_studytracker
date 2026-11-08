"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="system-panel w-full max-w-lg px-6 py-10 text-center">
        <span className="panel-corner panel-corner--tl" />
        <span className="panel-corner panel-corner--tr" />
        <span className="panel-corner panel-corner--bl" />
        <span className="panel-corner panel-corner--br" />
        <AlertTriangle
          className="mx-auto h-10 w-10 text-[#ff8296]"
          strokeWidth={1.2}
        />
        <p className="hud-label mt-5 text-[#ffb1bd]">System malfunction</p>
        <h1 className="title-display mt-2 text-2xl text-ice">
          Connection interrupted
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          An unexpected error disrupted the System. Your local record is safe.
          Re-establish the connection to continue.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-[0.6rem] text-muted/70">
            CODE {error.digest}
          </p>
        ) : null}
        <button type="button" onClick={reset} className="system-button mt-6">
          <RotateCcw className="h-4 w-4" /> Reconnect
        </button>
      </div>
    </div>
  );
}
