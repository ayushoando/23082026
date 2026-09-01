// Route entry. Implementation lives in site/features/ — this file exists only
// so the App Router picks the route up at this URL.
import type { Metadata } from "next";

// Noindex robots is inherited from features/Planner/layout.tsx; the page-level
// title only replaces the generic layout title in the tab/serp preview.
export const metadata: Metadata = {
  title: "Planner — Projects",
};

export { PlannerProjectsPage as default } from "@/features/Planner/projects/page";
