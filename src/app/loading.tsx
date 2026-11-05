import { SystemLoader } from "@/components/system-loader";

export default function Loading() {
  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="space-y-2">
        <div className="system-shimmer h-2.5 w-40" />
        <div className="system-shimmer h-8 w-64" />
        <div className="system-shimmer h-3 w-full max-w-lg" />
      </div>

      <SystemLoader />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="system-panel system-shimmer h-32" />
        <div className="system-panel system-shimmer h-32" />
      </div>
    </div>
  );
}
