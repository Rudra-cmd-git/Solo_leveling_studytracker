import Link from "next/link";
import { ArrowLeft, Radar } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="system-panel w-full max-w-lg px-6 py-10 text-center">
        <span className="panel-corner panel-corner--tl" />
        <span className="panel-corner panel-corner--tr" />
        <span className="panel-corner panel-corner--bl" />
        <span className="panel-corner panel-corner--br" />
        <Radar className="mx-auto h-10 w-10 text-glow" strokeWidth={1.2} />
        <p className="hud-label mt-5">Gate not found</p>
        <h1 className="title-display mt-2 text-3xl text-ice">404</h1>
        <p className="korean-accent mt-1">길을 잃었다</p>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted">
          This passage does not exist in the System. Return to the status window
          and continue your ascent.
        </p>
        <Link href="/" className="system-button mt-6">
          <ArrowLeft className="h-4 w-4" /> Return to status
        </Link>
      </div>
    </div>
  );
}
