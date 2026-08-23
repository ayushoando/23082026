import { Suspense } from "react";
import AdminCatalogPageView from "@/features/admin/catalog/AdminCatalogPageView";

export const dynamic = "force-dynamic";

export default function CatalogManagement() {
  return (
    <Suspense fallback={null}>
      <AdminCatalogPageView />
    </Suspense>
  );
}
