export type SectorTabId =
  | "financial-services"
  | "government-public-sector"
  | "education-social-impact"
  | "corporates-multinationals";

export interface SectorTabMeta {
  id: SectorTabId;
  label: string;
  panelId: string;
  tabId: string;
}

export interface ClientRecord {
  canonicalId: string;
  displayName: string;
  /** Source names and aliases retained for identity review and traceability. */
  sourceNames: readonly string[];
  sectorTab: SectorTabId;
  logoPath?: string;
  /** True only when the canonical record is approved for the public proof surface. */
  published: boolean;
  /** Existing project-photo work item associated with this canonical client, when present. */
  projectWorkId?: string;
}

export interface LogoApprovalRecord {
  logoAssetRef: string;
  sourceRef: string;
  rightsRef: string;
  approvalStatus: "Approved for Web Display" | "Not Approved" | "Pending";
  approvalDate?: string;
  approvingReviewerId?: string;
}
