import type { Metadata } from "next";

import "@focss/studio/entry.css";
import TopBar from "@studio/components/StudioTopBar";
import Toast from "@studio/components/StudioToast";
import { requireAuthUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Studio",
  description:
    "Furniture Studio — draw, dimension, and export catalog symbols. Sign-in workspace; not indexed.",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function StudioLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  await requireAuthUser("/oostudio", "admin");

  return (
    <main id="main-content" className="oostudio-root" tabIndex={-1}>
      <div className="app-root">
        <TopBar />
        {children}
        <Toast />
      </div>
    </main>
  );
}
