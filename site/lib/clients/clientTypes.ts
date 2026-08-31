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
  sectorTab: SectorTabId;
  logoPath?: string;
  published: boolean;
}

export interface LogoApprovalRecord {
  logoAssetRef: string;
  sourceRef: string;
  rightsRef: string;
  approvalStatus: "Approved for Web Display" | "Not Approved" | "Pending";
  approvalDate?: string;
  approvingReviewerId?: string;
}
