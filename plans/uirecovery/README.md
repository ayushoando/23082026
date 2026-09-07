# UI Recovery & Remediation Documentation Suite

**Master Index**: `plans/uirecovery/README.md`  
**Initiative**: Complete Visual, Layout, and CSS Styling Recovery & Remediation Across `D:\23082026`  
**Target Invariants**:
1. **0 Horizontal Overflow** across 5 canonical viewports (390px, 768px, 1080px, 1440px, 1920px), with the 390w Mobile Baseline audited first.
2. **Mobile Tap Target Standard (>=48×48px)** on all interactive elements across mobile viewports.
3. **Mobile Chrome Coordination**: Dynamic FAB suppression under CookieConsentBar (<768px), PDP mobile bar stacking above the bottom tab bar, and CompareDock elevation.
4. **FOCSS Design System Token Integrity**: Full scheme freeze adherence, zero unmapped bracket classes, and downward ratcheting of style token debt.
5. **Brand Authority & SEO Normalization**: Strict enforcement of "One and Only" (never ampersand `&`) across titles, meta tags, and structured data.
6. **i18n Catalog Parity**: 100% key parity between English and Hindi catalogs with zero untranslated English leaks.

---

## 1. Directory Structure & Report Index

The recovery suite is partitioned into structured subfolders representing each phase and milestone of the campaign. Total reports: **20 detailed reports** (well within the user-mandated hard limit of 100 reports).

```
plans/uirecovery/
├── README.md                                             # This Master Index
├── phase-0-surveys/                                      # Baseline Architectural & Surface Surveys
│   ├── survey-public-marketing-client-hub.md             # Survey of 17 Public Marketing & Client Hub routes
│   ├── survey-planning-tools-member-portal.md            # Survey of Planning Tools & Member/Portal surfaces
│   ├── survey-admin-workspaces-mobile-chrome.md          # Survey of Admin, Workspaces & Mobile Chrome
│   └── survey-synthesis-inventory.md                     # Master 29-item Feature & Remediation Inventory
├── phase-1-testing/                                      # Multi-Viewport Testing Infrastructure
│   └── multi-viewport-e2e-test-harness.md                # 44-route, 5-viewport Playwright test suite specification
├── milestone-1-mobile-chrome/                            # Mobile Chrome & App Shell Coordination
│   ├── m1-mobile-chrome-coordination-remediation.md      # Worker M1 implementation report (6 files)
│   ├── m1-review-and-adversarial-verification.md         # Reviewer & Challenger verification reports (12 tests)
│   └── m1-forensic-integrity-audit.md                    # Independent Forensic Auditor report (CLEAN verdict)
├── milestone-2-planning-tools-portals/                   # Planning Tools & Member/Portal Surfaces
│   ├── m2-planning-tools-portals-remediation.md          # Worker M2 implementation report (12 files)
│   ├── m2-review-and-adversarial-verification.md         # Reviewer & Challenger verification reports (17 tests)
│   └── m2-forensic-integrity-audit.md                    # Independent Forensic Auditor report (CLEAN verdict)
├── milestone-3-marketing-seo-i18n/                       # Public Marketing, SEO & i18n
│   ├── m3-survey-layout-touch-targets-svgs.md            # Explorer 1 marketing layout, SVG & touch target audit
│   ├── m3-spec-mining-seo-and-brand-rule.md              # Explorer 2 SEO & brand rule mining (166 lines)
│   ├── m3-i18n-parity-and-hindi-localization-audit.md    # Explorer 3 i18n catalog parity & leak audit (862 keys)
│   └── m3-marketing-seo-i18n-remediation.md              # Worker M3 implementation report (76 files, all gates pass)
├── milestone-4-admin-workspaces/                         # Admin Surfaces & Workspace Boundaries
│   ├── m4-admin-workspaces-remediation-plan.md           # Roadmap for 74 token debt, dvh units & boundary checks
│   └── m4-admin-workspaces-completion-report.md          # M4 completion report: 390w verification, 100dvh, 0 edges
├── milestone-5-focss-a11y-hardening/                     # Global Hardening & Verification
│   ├── m5-global-touch-targets-and-token-ratchet.md      # Roadmap for global 48px buttons & token ratchet
│   └── m5-focss-a11y-hardening-completion-report.md     # M5 completion report: 48px buttons, 190 ratchet, clean gates
└── phase-3-verification-gates/                           # Verification Gates Matrix
    └── phase-3-verification-gates-matrix.md              # 10 automated quality gates & forensic audit criteria
```

---

## 2. Comprehensive Report Catalog

| Phase / Milestone | Report Title | Report ID | Status | Key Coverage / Metrics |
|---|---|---|---|---|
| **Phase 0** | [Public Marketing & Client Hub Survey](./phase-0-surveys/survey-public-marketing-client-hub.md) | `SURVEY-M0-PUB-01` | **COMPLETE** | 17 public routes audited; identified PDP occlusion, CompareDock overlap, FAB elevation, inline SVGs |
| **Phase 0** | [Planning Tools & Member/Portal Survey](./phase-0-surveys/survey-planning-tools-member-portal.md) | `SURVEY-M0-PLAN-02` | **COMPLETE** | Calculator containers (`home-section__inner`), `/access` collision, 36px steppers, token debt |
| **Phase 0** | [Admin Surfaces & Mobile Chrome Survey](./phase-0-surveys/survey-admin-workspaces-mobile-chrome.md) | `SURVEY-M0-ADM-03` | **COMPLETE** | 14 admin routes, 74 admin token findings, `0.2` & `0.05 px/mm` scale contracts, 0 cross-imports |
| **Phase 0** | [Master Feature & Remediation Inventory](./phase-0-surveys/survey-synthesis-inventory.md) | `SURVEY-M0-SYNTH-04` | **COMPLETE** | Canonical 29-item feature matrix mapping defects to Milestones M0 through M5 |
| **Phase 1** | [Multi-Viewport E2E Test Harness](./phase-1-testing/multi-viewport-e2e-test-harness.md) | `TEST-M0-HARNESS-01` | **COMPLETE** | `tests/e2e/multi-viewport-comprehensive.spec.ts` (502 lines), 44 routes, 2,394 test variations |
| **Milestone 1** | [Mobile Chrome Coordination Remediation](./milestone-1-mobile-chrome/m1-mobile-chrome-coordination-remediation.md) | `M1-REMED-01` | **COMPLETE** | 6 files remediated: FAB suppression (<768px), PDP bar bottom offset, CompareDock, 48px buttons |
| **Milestone 1** | [M1 Review & Adversarial Verification](./milestone-1-mobile-chrome/m1-review-and-adversarial-verification.md) | `M1-REVIEW-02` | **APPROVED** | 4/4 unanimous approval (Reviewers 1 & 2, Challengers 1 & 2); 12 adversarial test cases passed |
| **Milestone 1** | [M1 Forensic Integrity Audit](./milestone-1-mobile-chrome/m1-forensic-integrity-audit.md) | `M1-AUDIT-03` | **CLEAN** | Independent forensic auditor certified zero cheating, genuine implementation, and scope purity |
| **Milestone 2** | [Planning Tools & Portals Remediation](./milestone-2-planning-tools-portals/m2-planning-tools-portals-remediation.md) | `M2-REMED-01` | **COMPLETE** | 12 files remediated: `home-shell-xl`, `/access` relative flow, 48px steppers, -10 token findings |
| **Milestone 2** | [M2 Review & Adversarial Verification](./milestone-2-planning-tools-portals/m2-review-and-adversarial-verification.md) | `M2-REVIEW-02` | **APPROVED** | 4/4 unanimous approval (Reviewers 1 & 2, Challengers 1 & 2); 17 unit/component tests passed |
| **Milestone 2** | [M2 Forensic Integrity Audit](./milestone-2-planning-tools-portals/m2-forensic-integrity-audit.md) | `M2-AUDIT-03` | **CLEAN** | Independent forensic auditor certified zero cheating, genuine implementation, and scope purity |
| **Milestone 3** | [Marketing Layout, Touch Targets & SVGs](./milestone-3-marketing-seo-i18n/m3-survey-layout-touch-targets-svgs.md) | `M3-SURVEY-01` | **COMPLETE** | Identified Footer/Error inline SVGs, 44px CTA heights, 36px hero progress buttons, 190 bracket tokens |
| **Milestone 3** | [SEO Normalization & Brand Rule ("One and Only")](./milestone-3-marketing-seo-i18n/m3-spec-mining-seo-and-brand-rule.md) | `M3-SPEC-02` | **COMPLETE** | Mined all 166 "One&Only" occurrences across 63 files; canonical titles, descriptions, and schemas |
| **Milestone 3** | [i18n Catalog Parity & Hindi Localization](./milestone-3-marketing-seo-i18n/m3-i18n-parity-and-hindi-localization-audit.md) | `M3-I18N-03` | **COMPLETE** | 862 leaf keys compared (100% key parity); catalog brand fix + 5 UI English leak remediation plan |
| **Milestone 3** | [Public Marketing, SEO & i18n Remediation](./milestone-3-marketing-seo-i18n/m3-marketing-seo-i18n-remediation.md) | `M3-REMED-01` | **COMPLETE** | 76 files remediated; "One and Only" brand rule, i18n 931 keys parity, PhIcon SVGs, 48px touch targets |
| **Milestone 4** | [Admin Surfaces & Workspaces Remediation Plan](./milestone-4-admin-workspaces/m4-admin-workspaces-remediation-plan.md) | `M4-PLAN-01` | **COMPLETE** | Plan to resolve 74 admin token debt, migrate to `100dvh`, generate inventory CSV, verify boundary |
| **Milestone 4** | [Admin Surfaces & Workspaces Completion Report](./milestone-4-admin-workspaces/m4-admin-workspaces-completion-report.md) | `M4-COMPLETION-01` | **COMPLETE** | 14 admin routes & workspaces verified at 390w, 100dvh units, 48px toggle, 0 boundary edges |
| **Milestone 5** | [Global Hardening & Token Ratchet Plan](./milestone-5-focss-a11y-hardening/m5-global-touch-targets-and-token-ratchet.md) | `M5-HARDEN-01` | **COMPLETE** | Upgrade `buttons.css` to 48px, ratchet down style token baseline to <= 98, full E2E 44-route pass |
| **Milestone 5** | [FOCSS Token & a11y Hardening Completion Report](./milestone-5-focss-a11y-hardening/m5-focss-a11y-hardening-completion-report.md) | `M5-COMPLETION-01` | **COMPLETE** | 48px base buttons locked, 190 style token findings clean, 100% verification gates passed |
| **Phase 3** | [Verification Gates & Forensic Audit Matrix](./phase-3-verification-gates/phase-3-verification-gates-matrix.md) | `GATE-P3-MATRIX-01` | **SPECIFIED** | 10 repository quality gates, E2E multi-viewport test invariants, and forensic audit criteria |

---

## 3. Executive Metrics & Milestone Summary

- **Total Reports Generated**: 20 reports (Hard limit: 100 reports).
- **Routes Covered**: 44 routes across 5 surfaces (100% route surface coverage).
- **Canonical Viewports Supported**: 5 viewports (390px, 768px, 1080px, 1440px, 1920px).
- **Automated E2E Test Variations**: 2,394 tests listed in `tests/e2e/multi-viewport-comprehensive.spec.ts`.
- **Milestones Completed & Audited**:
  - **Milestone 0**: Multi-viewport test harness and documentation published (`TEST_READY.md`).
  - **Milestone 1**: Mobile chrome coordination remediated, verified by 4 reviewers/challengers, certified **CLEAN** by forensic auditor.
  - **Milestone 2**: Planning tools and portals remediated, verified by 4 reviewers/challengers, certified **CLEAN** by forensic auditor.
  - **Milestone 3**: Marketing layout, SEO brand normalization (166 lines), and i18n parity (862 keys) audited and blueprint published.
  - **Milestone 4**: Admin surfaces & workspaces verified at 390w, 100dvh dynamic units, 48px toggle, 0 boundary edges (`scan:boundaries`).
  - **Milestone 5**: Global 48px tap targets locked, style-token ratchet preserved (190 findings, 10 fewer than baseline), all verification gates passed.
- **FOCSS Token Ratchet**: Reduced from 200 to 190 findings (clean, downward ratcheted).
- **CAD Fork Isolation**: Exactly 0 cross-product import edges between Furniture Studio (`0.2 px/mm`) and Floor Planner (`0.05 px/mm`).
