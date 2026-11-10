"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { LogOut, User, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded border border-[rgba(84,221,255,0.3)] bg-[#0a1024]/60 text-sm font-mono text-ice transition hover:bg-[#0f1a3d]/80",
          open && "border-glow/50"
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        <User className="h-4 w-4" />
        <span className="hidden sm:block">Account</span>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute right-0 mt-1 w-40 rounded-lg border border-[rgba(84,221,255,0.3)] bg-[#030812]/95 py-1 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl z-50"
          >
            <Link
              href="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-mono text-ice hover:bg-[#0a1024]/60"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <hr className="my-1 border-[rgba(84,221,255,0.2)]" />
            <button
              onClick={handleSignOut}
              className="flex w-full items-center gap-2 px-3 py-2 text-sm font-mono text-[#ff6b6b] hover:bg-[#3d0a0a]/60"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </motion.div>
        </>
      )}
    </div>
  );
}