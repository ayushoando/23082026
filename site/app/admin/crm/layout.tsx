import { isFeatureEnabled } from "@/lib/featureFlags";

export const dynamic = "force-dynamic";

export default function AdminCrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isFeatureEnabled("adminCrm")) {
    return (
      <div className="admin-page">
        <header className="admin-page__header">
          <div>
            <p className="admin-page__eyebrow">CRM</p>
            <h1 className="admin-page__title">CRM module is off</h1>
          </div>
        </header>
        <div
          className="admin-alert admin-alert--warn"
          role="status"
          style={{ marginTop: "1.5rem" }}
        >
          <p>
            The CRM module is currently disabled. Enable the{" "}
            <code>adminCrm</code> feature flag from{" "}
            <a href="/admin/features" className="admin-link">
              Admin → Features
            </a>{" "}
            to turn it on.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
