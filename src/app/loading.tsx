export default function Loading() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <div className="h-2.5 w-40 animate-pulse bg-[rgba(84,221,255,0.1)]" />
        <div className="h-8 w-64 animate-pulse bg-[rgba(84,221,255,0.12)]" />
        <div className="h-3 w-full max-w-lg animate-pulse bg-[rgba(84,221,255,0.07)]" />
      </div>

      <div className="system-panel min-h-40 p-5">
        <div className="flex items-center gap-3">
          <span className="h-8 w-8 animate-spin border border-glow/30 border-t-glow" />
          <div>
            <p className="hud-label hud-label--bright">Accessing System</p>
            <p className="mt-1 text-xs text-muted">
              Synchronizing hunter record...
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="system-panel h-32 animate-pulse bg-[rgba(3,10,20,0.25)]" />
        <div className="system-panel h-32 animate-pulse bg-[rgba(3,10,20,0.25)]" />
      </div>
    </div>
  );
}
