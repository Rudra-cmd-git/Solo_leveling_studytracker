import type { Metadata } from "next";
import { SoundLab } from "@/components/sound-lab";

export const metadata: Metadata = {
  title: "Sound Lab | The System",
  robots: {
    index: false,
    follow: false,
  },
};

export default function SoundLabPage() {
  return <SoundLab />;
}
