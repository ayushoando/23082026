import type { SectorTabMeta, ClientRecord } from "./clientTypes";

export const SECTOR_TABS: SectorTabMeta[] = [
  {
    id: "financial-services",
    label: "Financial Services",
    tabId: "tab-financial-services",
    panelId: "panel-financial-services",
  },
  {
    id: "government-public-sector",
    label: "Government & Public Sector",
    tabId: "tab-government-public-sector",
    panelId: "panel-government-public-sector",
  },
  {
    id: "education-social-impact",
    label: "Education, Social Impact & Development",
    tabId: "tab-education-social-impact",
    panelId: "panel-education-social-impact",
  },
  {
    id: "corporates-multinationals",
    label: "Corporates & Multinationals",
    tabId: "tab-corporates-multinationals",
    panelId: "panel-corporates-multinationals",
  },
];

export const CLIENT_REGISTRY: ClientRecord[] = [
  // ── Financial Services ──────────────────────────────────────────────────
  {
    canonicalId: "state-bank-of-india",
    displayName: "State Bank of India",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "corporation-bank",
    displayName: "Corporation Bank",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "janalakshmi-bank-limited",
    displayName: "Janalakshmi Bank Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "annapurna-bank-limited",
    displayName: "Annapurna Bank Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "bandhan-bank-limited",
    displayName: "Bandhan Bank Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "syndicate-bank-limited",
    displayName: "Syndicate Bank Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "united-bank-limited",
    displayName: "United Bank Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "canara-bank-limited",
    displayName: "Canara Bank Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "uco-bank-limited",
    displayName: "UCO Bank Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "can-fin-homes",
    displayName: "Can Fin Homes",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "sbi-life",
    displayName: "SBI Life",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "hdfc-limited",
    displayName: "HDFC Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "union-bank-of-india",
    displayName: "Union Bank of India",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "standard-chartered-bank",
    displayName: "Standard Chartered Bank",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "franklin-templeton",
    displayName: "Franklin Templeton",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "l-and-t-finance-limited",
    displayName: "L&T Finance Limited",
    sectorTab: "financial-services",
    published: false, // @review
  },
  {
    canonicalId: "shriram-commercial-vehicle-finance",
    displayName: "Shriram Commercial Vehicle Finance",
    sectorTab: "financial-services",
    published: false, // @review
  },

  // ── Government & Public Sector ──────────────────────────────────────────
  {
    canonicalId: "patna-high-court",
    displayName: "Patna High Court",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "bhel",
    displayName: "BHEL",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "bihar-state-electronics-development-corporation-limited",
    displayName: "Bihar State Electronics Development Corporation Limited",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "rural-works-department-government-of-bihar",
    displayName: "Rural Works Department, Government of Bihar",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "bihar-state-power-holding-company-limited",
    displayName: "Bihar State Power Holding Company Limited",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "rourkela-steel-plant",
    displayName: "Rourkela Steel Plant",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "bihar-state-pul-nirman-nigam-limited",
    displayName: "Bihar State Pul Nirman Nigam Limited",
    sectorTab: "government-public-sector",
    published: false, // @review — Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed display name, or withhold.
  },
  {
    canonicalId: "bihar-state-road-development-corporation-limited",
    displayName: "Bihar State Road Development Corporation Limited",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "airports-authority-of-india",
    displayName: "Airports Authority of India",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "bameti",
    displayName: "BAMETI",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "bihar-tourism",
    displayName: "Bihar Tourism",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "income-tax-department",
    displayName: "Income Tax Department",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "steel-authority-of-india-limited",
    displayName: "Steel Authority of India Limited",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "building-construction-department",
    displayName: "Building Construction Department",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "iocl",
    displayName: "IOCL",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "survey-of-india",
    displayName: "Survey of India",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "cpwd",
    displayName: "CPWD",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "biada-bihar",
    displayName: "BIADA Bihar",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "bihar-foundation",
    displayName: "Bihar Foundation",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "indian-army",
    displayName: "Indian Army",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "tourism-department",
    displayName: "Tourism Department",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "excise-and-customs-department-jamshedpur",
    displayName: "Excise and Customs Department, Jamshedpur",
    sectorTab: "government-public-sector",
    published: false, // @review
  },
  {
    canonicalId: "jeevika",
    displayName: "JEEViKA",
    sectorTab: "government-public-sector",
    published: false, // @review
  },

  // ── Education, Social Impact & Development ──────────────────────────────
  {
    canonicalId: "care-india",
    displayName: "CARE India",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "unicef",
    displayName: "UNICEF",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "world-health-organization-who",
    displayName: "World Health Organization (WHO)",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "azim-premji-foundation",
    displayName: "Azim Premji Foundation",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "helpage-india",
    displayName: "HelpAge India",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "gd-goenka",
    displayName: "GD Goenka",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "college-of-horticulture",
    displayName: "College of Horticulture",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "aiims-patna",
    displayName: "AIIMS Patna",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "ipac",
    displayName: "IPAC",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "fhi-solutions-llc-bill-and-melinda-gates-foundation",
    displayName: "FHI Solutions LLC / Bill & Melinda Gates Foundation",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "iit-patna",
    displayName: "IIT Patna",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "aditya-birla-school",
    displayName: "Aditya Birla School",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "kidzee-school",
    displayName: "Kidzee School",
    sectorTab: "education-social-impact",
    published: false, // @review
  },
  {
    canonicalId: "dalmia-dsp-po",
    displayName: "Dalmia DSP PO",
    sectorTab: "education-social-impact",
    published: false, // @review — Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed display name, or withhold.
  },
  {
    canonicalId: "titan-limited",
    displayName: "Titan Limited",
    sectorTab: "education-social-impact",
    published: false, // @review — Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed display name, or withhold.
  },
  {
    canonicalId: "kone-elevators",
    displayName: "Kone Elevators",
    sectorTab: "education-social-impact",
    published: false, // @review — Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed display name, or withhold.
  },
  {
    canonicalId: "cimp",
    displayName: "CIMP",
    sectorTab: "education-social-impact",
    published: false, // @review
  },

  // ── Corporates & Multinationals ─────────────────────────────────────────
  {
    canonicalId: "tata-motors-limited",
    displayName: "Tata Motors Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review — Potential duplicate or related legal-name variant with "Tata Motors"; merge under one Canonical Client ID or keep distinct.
  },
  {
    canonicalId: "bharti-airtel-limited",
    displayName: "Bharti Airtel Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review — Owner-supplied repeated-entry cue; confirm source cardinality and Canonical Client ID.
  },
  {
    canonicalId: "ispat-ltd",
    displayName: "Ispat Ltd",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "mecon-limited",
    displayName: "MECON Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "tvs-limited",
    displayName: "TVS Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review — Owner-supplied repeated-entry cue; confirm source cardinality and Canonical Client ID.
  },
  {
    canonicalId: "vodafone-limited",
    displayName: "Vodafone Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "amul",
    displayName: "Amul",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "aakash-education",
    displayName: "Aakash Education",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "dmi",
    displayName: "DMI",
    sectorTab: "corporates-multinationals",
    published: false, // @review — Owner-supplied repeated-entry cue; confirm source cardinality and Canonical Client ID.
  },
  {
    canonicalId: "paradeep-phosphates",
    displayName: "Paradeep Phosphates",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "cri-pumps",
    displayName: "CRI Pumps",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "bharti-nxtra-limited",
    displayName: "Bharti Nxtra Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review — Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed display name, or withhold.
  },
  {
    canonicalId: "virbac-animal-health",
    displayName: "Virbac Animal Health",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "tata-motors",
    displayName: "Tata Motors",
    sectorTab: "corporates-multinationals",
    published: false, // @review — Potential duplicate or related legal-name variant with "Tata Motors Limited"; merge under one Canonical Client ID or keep distinct.
  },
  {
    canonicalId: "essel-power-limited",
    displayName: "Essel Power Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "coca-cola",
    displayName: "Coca-Cola",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "usha-international-ltd",
    displayName: "Usha International Ltd",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "hyundai-limited",
    displayName: "Hyundai Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "livspace-limited",
    displayName: "Livspace Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "itc-dairy-limited",
    displayName: "ITC Dairy Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "maruti-suzuki-limited",
    displayName: "Maruti Suzuki Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "amara-raja-battery",
    displayName: "Amara Raja Battery",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "diageo-limited",
    displayName: "Diageo Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "adani-power",
    displayName: "Adani Power",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "asian-paints-limited",
    displayName: "Asian Paints Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "bbc-media-limited",
    displayName: "BBC Media Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "ricoh-india-limited",
    displayName: "Ricoh India Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "crompton-greaves-limited",
    displayName: "Crompton Greaves Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "micro-focus-limited",
    displayName: "Micro Focus Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
  {
    canonicalId: "ultratech-limited",
    displayName: "UltraTech Limited",
    sectorTab: "corporates-multinationals",
    published: false, // @review
  },
];
