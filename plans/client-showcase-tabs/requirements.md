# Requirements Document

## Introduction

Client Showcase Tabs is a content-led enhancement to the marketing Clients experience. The feature will present reviewed client organizations in a consistent logo-and-name card collection, organized by a fixed sector taxonomy with no more than four public tabs.

The supplied names are source inventory, not confirmed corrections, logo permissions, or final public labels. This document preserves the supplied text and requires a content-review decision for uncertain classifications, potential duplicates, and unclear or typo-prone names. This document defines target behavior only; no current rendered behavior, logo licence, logo ownership, or source implementation is asserted.

## Information Architecture

The public navigation uses exactly these four Sector Tabs, in this order. There is no additional catch-all tab in the public tab list.

| Order | Sector Tab | Intended coverage |
| --- | --- | --- |
| 1 | **Financial Services** | Banks, lenders, insurers, housing finance, investment, and asset-management organizations. State Bank of India belongs in this tab. |
| 2 | **Government & Public Sector** | Central and state government departments, courts, armed forces, statutory bodies, public-sector undertakings, government-owned corporations, and official tourism bodies. |
| 3 | **Education, Social Impact & Development** | Schools, colleges, institutes, foundations, charities, development organizations, and international public-health or development bodies. |
| 4 | **Corporates & Multinationals** | Indian commercial organizations and multinational commercial organizations that do not belong to the other three tabs. |

This structure combines central and state government into **Government & Public Sector**, education with social-impact and development organizations into **Education, Social Impact & Development**, and Indian corporates with multinational organizations into **Corporates & Multinationals**. A Content Reviewer must resolve every record that does not fit a tab unambiguously before public publication.

## Glossary

- **Client Showcase**: The public-facing collection of reviewed client organizations, Sector Tabs, Tab Panels, and Client Cards.
- **Client Content Registry**: The maintainable structured collection from which the Client Showcase receives client content and review status.
- **Source Inventory**: The supplied list of Submitted Client Names retained in this document and in the Client Content Registry.
- **Submitted Client Name**: A client name retained exactly as supplied in the Source Inventory.
- **Normalized Display Name**: A reviewer-approved public-facing client name stored separately from the Submitted Client Name.
- **Normalized Comparison Key**: A non-public comparison value created by case-folding and normalizing only spacing and punctuation in a Submitted Client Name. The value does not silently correct words or remove legal suffixes.
- **Canonical Client ID**: A stable identifier for one reviewer-approved client organization.
- **Client Content Record**: One structured record representing a Submitted Client Name, proposed or approved public metadata, and review state.
- **Published Client Record**: A Client Content Record with an approved Normalized Display Name, Canonical Client ID, Sector Tab, and publication decision.
- **Sector Tab**: One of the four fixed public categories defined in the Information Architecture table.
- **Tab Panel**: The content area associated with one selected Sector Tab.
- **Focused Sector Tab**: The Sector Tab that currently receives keyboard input.
- **Content Review Queue**: The worklist of Client Content Records requiring an explicit Content Reviewer decision before public publication or a public-data change.
- **Content Reviewer**: An authorized content owner who records a classification, name, duplicate, publication, or logo decision.
- **Logo Approval Record**: The source reference, rights or permission reference, web-display approval status, approval date, approving reviewer identifier, and associated logo asset reference for one client logo.
- **Approved Logo Record**: A Logo Approval Record whose web-display approval status is **Approved for Web Display**.
- **Logo Fallback**: The deterministic neutral brand area that displays the Normalized Display Name when no Approved Logo Record can be rendered.
- **Partial-logo State**: A selected Sector Tab that contains both Client Cards with Approved Logo Records and Client Cards with Logo Fallbacks.
- **Empty-sector State**: A selected Sector Tab that has no Published Client Records.
- **Review Decision**: An explicit reviewer outcome of approved as supplied, approved with a Normalized Display Name, merged with a Canonical Client ID, kept distinct, withheld, or rejected.
- **CSS Pixel**: A CSS layout unit used to define viewport width and target size.
- **WCAG 2.2 Level AA**: The Web Content Accessibility Guidelines version 2.2 conformance level AA.
- **en-IN Collation**: A deterministic, case-insensitive English (India) alphabetical comparison used for ordering Normalized Display Names.
- **Wide Viewport**: A viewport width of 1440 CSS Pixels or wider, including 1920 CSS Pixels.
- **Content Max-Width**: The maximum CSS width applied to the Client Showcase container so that content does not stretch across the full wide-viewport width.
- **Auto-sizing Grid**: A CSS grid whose column count and column width adapt to the available container width without explicit breakpoint-specific column counts, implemented with Tailwind CSS v4 responsive utilities.
- **Overflow Containment**: The guarantee that no child element causes a horizontal scrollbar or horizontal bleed beyond the Client Showcase container boundary at any viewport width.

## Requirements

### Requirement 1: Establish the fixed sector taxonomy

**User Story:** As a prospective client, I want organizations grouped into clear sectors, so that I can quickly find relevant client experience.

#### Acceptance Criteria

1. THE Client Showcase SHALL display exactly four public Sector Tabs in this order: Financial Services; Government & Public Sector; Education, Social Impact & Development; Corporates & Multinationals.
2. WHEN a Content Reviewer approves a Sector Tab for a Client Content Record, THE Client Content Registry SHALL assign exactly one of the four fixed Sector Tabs to that Client Content Record.
3. WHEN State Bank of India becomes a Published Client Record, THE Client Showcase SHALL place State Bank of India in Financial Services.
4. IF a Client Content Record has a classification status of review required, THEN THE Client Showcase SHALL withhold that Client Content Record from every public Sector Tab.
5. IF a Client Content Record has a classification status of review required, THEN THE Content Review Queue SHALL retain that Client Content Record until a Content Reviewer records a Sector Tab decision.
6. WHEN a selected Sector Tab has Published Client Records, THE Client Showcase SHALL display only Published Client Records assigned to the selected Sector Tab in the associated Tab Panel.

### Requirement 2: Provide accessible, responsive tab interaction

**User Story:** As a keyboard, touch, or assistive-technology user, I want predictable sector controls, so that I can browse every group without a pointing device or a wide screen.

#### Acceptance Criteria

1. THE Client Showcase SHALL expose every Sector Tab, selected state, and associated Tab Panel relationship programmatically to assistive technology.
2. WHEN a keyboard user presses ArrowRight on a Focused Sector Tab, THE Client Showcase SHALL move focus to the next Sector Tab and wrap focus from Corporates & Multinationals to Financial Services while retaining the selected Sector Tab.
3. WHEN a keyboard user presses ArrowLeft on a Focused Sector Tab, THE Client Showcase SHALL move focus to the preceding Sector Tab and wrap focus from Financial Services to Corporates & Multinationals while retaining the selected Sector Tab.
4. WHEN a keyboard user presses Home on a Focused Sector Tab, THE Client Showcase SHALL move focus to Financial Services while retaining the selected Sector Tab.
5. WHEN a keyboard user presses End on a Focused Sector Tab, THE Client Showcase SHALL move focus to Corporates & Multinationals while retaining the selected Sector Tab.
6. WHEN a keyboard user presses Enter or Space on a Focused Sector Tab, THE Client Showcase SHALL select the Focused Sector Tab and display the associated Tab Panel.
7. THE Client Showcase SHALL provide every Sector Tab with a target area of at least 44 CSS Pixels by 44 CSS Pixels.
8. THE Client Showcase SHALL provide every Sector Tab with a visible keyboard focus indicator that conforms to WCAG 2.2 Level AA.
9. WHILE the viewport width is from 320 through 767 CSS Pixels, THE Client Showcase SHALL present the four Sector Tabs in one horizontally touch-scrollable row with each complete tab label available through scrolling.
10. WHILE the viewport width is 320 CSS Pixels or wider, THE Client Showcase SHALL keep Client Card content within the viewport without horizontal page scrolling.

### Requirement 3: Present consistent client cards and deterministic logo fallback

**User Story:** As a prospective client, I want a polished and readable client collection, so that the organization’s delivery experience appears credible even when a logo is unavailable.

#### Acceptance Criteria

1. THE Client Showcase SHALL render every Published Client Record as one Client Card containing the Normalized Display Name and a brand visual area.
2. WHEN a Published Client Record has an Approved Logo Record, THE Client Showcase SHALL render the associated logo asset in the Client Card brand visual area while preserving the logo asset’s aspect ratio.
3. IF a Published Client Record has no Approved Logo Record, THEN THE Client Showcase SHALL render the Logo Fallback using that Published Client Record’s Normalized Display Name.
4. IF an Approved Logo Record cannot be rendered, THEN THE Client Showcase SHALL replace the logo asset with the Logo Fallback and retain the Client Card in the selected Tab Panel.
5. WHILE a selected Sector Tab is in a Partial-logo State, THE Client Showcase SHALL render every Published Client Record assigned to the selected Sector Tab.
6. THE Client Showcase SHALL provide each Client Card with an accessible name derived from the Normalized Display Name.
7. THE Client Showcase SHALL render the full Normalized Display Name for every Client Card as text content.

### Requirement 4: Enforce the logo source and approval boundary

**User Story:** As a content owner, I want logo publication to depend on recorded approval, so that the showcase does not imply unverified logo rights or source provenance.

#### Acceptance Criteria

1. THE Client Content Registry SHALL retain one Logo Approval Record for every logo asset associated with a Client Content Record.
2. THE Logo Approval Record SHALL retain the logo asset reference, source reference, rights or permission reference, web-display approval status, approval date, and approving reviewer identifier.
3. WHEN a Logo Approval Record has a web-display approval status of Approved for Web Display, THE Client Showcase SHALL treat the associated logo asset as eligible for the Client Card brand visual area.
4. IF a logo asset has no corresponding Logo Approval Record, THEN THE Client Content Registry SHALL classify the logo asset as not approved for web display.
5. WHERE a Logo Approval Record does not have a web-display approval status of Approved for Web Display, THE Client Showcase SHALL use the Logo Fallback for the associated Published Client Record.
6. WHEN a logo source or approval status requires a Content Reviewer decision, THE Content Review Queue SHALL retain the logo decision with the associated Client Content Record.

### Requirement 5: Preserve source names and resolve duplicates through review

**User Story:** As a content owner, I want supplied names preserved and ambiguous records reviewed, so that the public showcase remains accurate without silent corrections or accidental duplicate cards.

#### Acceptance Criteria

1. THE Client Content Registry SHALL retain every Submitted Client Name exactly as supplied in the Source Inventory.
2. WHEN a Content Reviewer approves a Normalized Display Name, THE Client Content Registry SHALL store the Normalized Display Name separately from the Submitted Client Name.
3. WHEN a Client Content Record has an ambiguous, typo-prone, or potentially duplicate identity, THE Content Review Queue SHALL require a Review Decision before the Client Content Record becomes a Published Client Record.
4. IF two Client Content Records have the same Normalized Comparison Key, THEN THE Content Review Queue SHALL retain a duplicate decision before either Client Content Record becomes a Published Client Record.
5. WHEN a Content Reviewer approves two or more Client Content Records as one Canonical Client ID, THE Client Showcase SHALL render one Client Card for that Canonical Client ID.
6. WHEN a Content Reviewer keeps potentially similar Client Content Records distinct, THE Client Content Registry SHALL retain a distinct Canonical Client ID for each Client Content Record.
7. THE Content Review Queue SHALL contain every review cue in the Initial Review Cues table before public publication begins.

#### Initial Review Cues

The following cues are review work, not corrections. The supplied names must remain unchanged until a Content Reviewer records a Review Decision.

| Submitted Client Name or pair | Review cue | Required decision |
| --- | --- | --- |
| Tata Motors / Tata Motors Limited | Potential duplicate or related legal-name variant | Merge under one Canonical Client ID or keep distinct. |
| TVS Limited | Owner-supplied repeated-entry cue | Confirm source cardinality and Canonical Client ID. |
| Bharti Airtel Limited | Owner-supplied repeated-entry cue | Confirm source cardinality and Canonical Client ID. |
| DMI | Owner-supplied repeated-entry cue | Confirm source cardinality and Canonical Client ID. |
| Dalmia DSP PO | Unclear supplied spelling or entity identity | Approve as supplied, approve a reviewed display name, or withhold. |
| Itian Limited | Unclear supplied spelling or entity identity | Approve as supplied, approve a reviewed display name, or withhold. |
| Bihar State Pul Nirman Nigam Limited | Unclear supplied spelling or entity identity | Approve as supplied, approve a reviewed display name, or withhold. |
| Bharti Nxtra Limited | Unclear supplied spelling or entity identity | Approve as supplied, approve a reviewed display name, or withhold. |
| June Elevators | Unclear supplied spelling or entity identity | Approve as supplied, approve a reviewed display name, or withhold. |

### Requirement 6: Keep ordering and empty states predictable

**User Story:** As a prospective client, I want stable client ordering and clear empty states, so that sector browsing remains understandable as content changes.

#### Acceptance Criteria

1. THE Client Showcase SHALL order Client Cards in each Sector Tab by Normalized Display Name using en-IN Collation and then by Canonical Client ID.
2. WHEN the Source Inventory order changes without changes to Published Client Records, THE Client Showcase SHALL retain the Client Card order defined by en-IN Collation and Canonical Client ID.
3. IF a selected Sector Tab has no Published Client Records, THEN THE Client Showcase SHALL display an Empty-sector State that names the selected Sector Tab.
4. IF a selected Sector Tab has no Published Client Records, THEN THE Client Showcase SHALL keep every Sector Tab available for selection.
5. WHILE a selected Sector Tab contains one or more Published Client Records, THE Client Showcase SHALL display the Client Cards assigned to the selected Sector Tab instead of the Empty-sector State.

### Requirement 7: Keep client content maintainable and auditable

**User Story:** As a content owner, I want client information maintained as reviewable structured records, so that names, sectors, logos, and publication decisions can change without rewriting the client-card presentation.

#### Acceptance Criteria

1. THE Client Content Registry SHALL maintain each Client Content Record independently from Client Card presentation rules.
2. THE Client Content Registry SHALL retain a Submitted Client Name, Normalized Display Name, Normalized Comparison Key, Canonical Client ID, Sector Tab, publication status, logo asset reference, Logo Approval Record reference, Review Decision, reviewer identifier, and decision timestamp for every Client Content Record.
3. WHEN a Content Reviewer changes a name, classification, duplicate, publication, or logo decision, THE Client Content Registry SHALL retain the new Review Decision with the reviewer identifier and decision timestamp.
4. WHEN a Content Reviewer adds or updates a Published Client Record, THE Client Content Registry SHALL determine the public Sector Tab, Logo Fallback eligibility, and Client Card ordering from the approved fields of that Client Content Record.
5. WHEN a Content Reviewer merges Submitted Client Names under one Canonical Client ID, THE Client Content Registry SHALL retain links from the Canonical Client ID to every contributing Submitted Client Name.

### Requirement 8: Contain layout at wide viewports and enforce auto-sizing

**User Story:** As a prospective client viewing the showcase on a wide monitor, I want content to stay visually aligned and readable at 1920 CSS Pixels and larger, so that the layout does not stretch uncomfortably across the full screen width and no content bleeds outside its container.

#### Acceptance Criteria

1. THE Client Showcase container SHALL apply a Content Max-Width that prevents the tab row, Tab Panel, and Client Card grid from stretching beyond a defined maximum width at Wide Viewport widths.
2. WHILE the viewport width equals or exceeds the Content Max-Width, THE Client Showcase container SHALL be horizontally centered in the viewport with equal left and right margins.
3. THE Client Showcase SHALL implement the Client Card grid as an Auto-sizing Grid using Tailwind CSS v4 responsive utilities, without hard-coded per-breakpoint column counts in the component markup.
4. AT every viewport width from 320 CSS Pixels through 1920 CSS Pixels and wider, THE Client Showcase SHALL maintain Overflow Containment so that no horizontal scrollbar appears on the page and no Client Card or tab element bleeds outside the Client Showcase container boundary.
5. WHILE the viewport width is 1440 CSS Pixels or wider, THE Client Showcase container SHALL remain horizontally centered and no Client Card or Sector Tab label SHALL be truncated due to container overflow.
6. THE Client Showcase SHALL use only Tailwind CSS v4 utility classes for all sizing, spacing, and grid layout; no custom pixel widths SHALL be hard-coded in component styles outside the design-token and FOCSS layer.

## Correctness Properties

The following are implementation-agnostic, executable test contracts. The properties are targets for automated property, model, component, or browser checks; no current tests or runtime results are implied by this document.

| ID | Property type | Executable property |
| --- | --- | --- |
| P1 | Property-based | For every generated Client Content Registry, the public tab label sequence equals `[Financial Services, Government & Public Sector, Education, Social Impact & Development, Corporates & Multinationals]` and has a length of four. |
| P2 | Property-based | For every generated Client Content Registry, every Published Client Record has exactly one valid Sector Tab and appears in exactly one matching Tab Panel. |
| P3 | Example | A fixture containing Published State Bank of India renders State Bank of India only in Financial Services. |
| P4 | Property-based | For every generated Client Content Record with a review-required classification or identity status, no public Tab Panel contains that record and the Content Review Queue retains that record. |
| P5 | Model-based | For each focused tab index from zero through three, ArrowRight, ArrowLeft, Home, End, Enter, and Space produce the focus and selected-tab transitions specified in Requirement 2. |
| P6 | Component/property-based | For every generated Published Client Record, an Approved Logo Record selects the approved asset; every other logo state selects a Logo Fallback containing the same Normalized Display Name; neither path removes the Client Card. |
| P7 | Property-based | For every generated mixture of approved-logo and fallback-logo records in a selected Sector Tab, the rendered Canonical Client ID set equals the selected tab’s Published Client Record set. |
| P8 | Property-based | For every generated Submitted Client Name, the stored Submitted Client Name equals the input string byte-for-byte after registry processing, regardless of any separate Normalized Display Name. |
| P9 | Property-based | For every generated registry with an approved merge, each Canonical Client ID appears at most once in the rendered Client Card collection and retains all contributing Submitted Client Names in registry data. |
| P10 | Metamorphic/property-based | For every permutation of the same Published Client Records, each Tab Panel renders the same Canonical Client ID sequence when the Normalized Display Names and Canonical Client IDs are unchanged. |
| P11 | Property-based | For every valid Sector Tab with zero Published Client Records, selecting that tab produces its Empty-sector State and leaves all four Sector Tabs selectable. |
| P12 | Example-based browser check | At 320, 768, and 1024 CSS Pixel viewport widths, a browser check confirms that a keyboard user can focus and select every Sector Tab, each full tab label and Client Card Normalized Display Name is available, the selected tab has a visible focus treatment, and horizontal page overflow is absent other than the 320 CSS Pixel mobile tab row. |
| P13 | Example | The initial Content Review Queue includes every Initial Review Cue row before any associated record becomes public. |
| P14 | Example-based browser check | At viewport widths 320, 768, 1280, 1440, and 1920 CSS Pixels, a browser check confirms that the Client Showcase container is horizontally centered, no horizontal scrollbar is present on the page, no Client Card or tab element overflows the container boundary, and the Auto-sizing Grid column count adjusts without empty trailing columns wider than one card. |

## Supplied Source Inventory (verbatim)

The following inventory is retained exactly as supplied. This inventory is not the final publication list and does not authorize a correction, merge, classification, or logo use.

1. State Bank of India
2. Tata Motors Limited
3. Bharti Airtel Limited
4. Corporation Bank
5. CARE India
6. UNICEF
7. World Health Organization (WHO)
8. Azim Premji Foundation
9. HelpAge India
10. Ispat Ltd
11. MECON Limited
12. TVS Limited
13. Patna High Court
14. BHEL
15. GD Goenka
16. Bihar State Electronics Development Corporation Limited
17. Rural Works Department, Government of Bihar
18. Bihar State Power Holding Company Limited
19. Vodafone Limited
20. Amul
21. Aakash Education
22. Rourkela Steel Plant
23. Bihar State Pul Nirman Nigam Limited
24. Bihar State Road Development Corporation Limited
25. Airports Authority of India
26. BAMETI
27. DMI
28. CIMP
29. June Elevators
30. Paradeep Phosphates
31. CRI Pumps
32. Bihar Tourism
33. Income Tax Department
34. Bharti Nxtra Limited
35. Virbac Animal Health
36. Tata Motors
37. Essel Power Limited
38. Janalakshmi Bank Limited
39. Annapurna Bank Limited
40. Bandhan Bank Limited
41. Syndicate Bank Limited
42. United Bank Limited
43. Canara Bank Limited
44. UCO Bank Limited
45. Can Fin Homes
46. SBI Life
47. College of Horticulture
48. Coca-Cola
49. IOCL
50. Dalmia DSP PO
51. Steel Authority of India Limited
52. Usha International Ltd
53. Building Construction Department
54. HDFC Limited
55. Hyundai Limited
56. Livspace Limited
57. ITC Dairy Limited
58. AIIMS Patna
59. IPAC
60. Union Bank of India
61. Survey of India
62. CPWD
63. Maruti Suzuki Limited
64. Amara Raja Battery
65. L&T Finance Limited
66. Itian Limited
67. Diageo Limited
68. Standard Chartered Bank
69. Franklin Templeton
70. BIADA Bihar
71. Bihar Foundation
72. Indian Army
73. Adani Power
74. Tourism Department
75. Excise and Customs Department, Jamshedpur
76. FHI Solutions LLC / Bill & Melinda Gates Foundation
77. Asian Paints Limited
78. BBC Media Limited
79. Ricoh India Limited
80. JEEViKA
81. Shriram Commercial Vehicle Finance
82. Crompton Greaves Limited
83. Micro Focus Limited
84. UltraTech Limited
85. IIT Patna
86. Aditya Birla School
87. Kidzee School

## Content Decisions Requiring Review

- The four-tab information architecture is fixed by this document, but each supplied organization requires a reviewable Sector Tab assignment before publication unless a Content Reviewer has already approved that assignment.
- State Bank of India is explicitly treated as a Financial Services organization, not as a government organization.
- The listed logo assets, if any, require a Logo Approval Record before public display. This document makes no statement that any listed or local asset has confirmed rights or approval.
- The owner-supplied repeated-entry cues for TVS Limited, Bharti Airtel Limited, and DMI remain queue items even when the retained inventory presents a single visible instance of a name.
