import type { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import { Cinzel, JetBrains_Mono, Rajdhani } from "next/font/google";
import { AppShell } from "@/components/app-shell";
import { BattlefieldAtmosphere } from "@/components/battlefield-atmosphere";
import { MotionProvider } from "@/components/motion/motion-provider";
import { OnboardingGate } from "@/components/onboarding-gate";
import { getSettingsData, getShellData } from "@/lib/data";
import "./globals.css";

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const rajdhani = Rajdhani({
  variable: "--font-rajdhani",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "The System | Solo Leveling Study Tracker",
  description:
    "A Solo Leveling-inspired study tracker. Complete daily quests, earn XP, raise your rank, and level up as a student Hunter.",
  applicationName: "The System",
};

export const viewport: Viewport = {
  themeColor: "#02050b",
  colorScheme: "dark",
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const shell = await getShellData();
  const settings = await getSettingsData();

  return (
    <html
      lang="en"
      className={`${cinzel.variable} ${rajdhani.variable} ${jetbrainsMono.variable}`}
    >
      <body>
        <BattlefieldAtmosphere />
        <MotionProvider>
          <AppShell shell={shell}>{children}</AppShell>
          {!shell.onboarded ? (
            <OnboardingGate initialTimeZone={settings.timezone} />
          ) : null}
        </MotionProvider>
      </body>
    </html>
  );
}
