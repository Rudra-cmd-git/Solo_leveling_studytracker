import type { ReactNode } from "react";
import type { ShellData } from "@/lib/types";
import {
  MobileNavigation,
  MobileTopBar,
  SideNavigation,
} from "./navigation";

export function AppShell({
  children,
  shell,
}: {
  children: ReactNode;
  shell: ShellData;
}) {
  return (
    <div className="relative z-10 min-h-screen">
      <SideNavigation shell={shell} />
      <MobileTopBar shell={shell} />
      <main className="px-4 pb-28 pt-5 sm:px-6 lg:ml-[18.5rem] lg:px-8 lg:pb-12 lg:pt-8">
        <div className="mx-auto w-full max-w-[1240px]">{children}</div>
      </main>
      <MobileNavigation />
    </div>
  );
}
