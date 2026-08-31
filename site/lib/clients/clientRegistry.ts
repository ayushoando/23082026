import type { ClientRecord, SectorTabMeta } from "./clientTypes";

export const SECTOR_TABS: SectorTabMeta[] = [
  {
    id: "financial-services",
    label: "Financial Services",
    panelId: "panel-financial-services",
    tabId: "tab-financial-services",
  },
  {
    id: "government-public-sector",
    label: "Government & Public Sector",
    panelId: "panel-government-public-sector",
    tabId: "tab-government-public-sector",
  },
  {
    id: "education-social-impact",
    label: "Education, Social Impact & Development",
    panelId: "panel-education-social-impact",
    tabId: "tab-education-social-impact",
  },
  {
    id: "corporates-multinationals",
    label: "Corporates & Multinationals",
    panelId: "panel-corporates-multinationals",
    tabId: "tab-corporates-multinationals",
  },
];

export const CLIENT_REGISTRY: ClientRecord[] = [
  // @review Requires publication and sector decisions.
  { canonicalId: "state-bank-of-india", displayName: "State Bank of India", sectorTab: "financial-services", published: false },
  // @review Potential duplicate with Tata Motors; merge or keep distinct before publication.
  { canonicalId: "tata-motors-limited", displayName: "Tata Motors Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Repeated-entry cue; confirm source cardinality and canonical client ID.
  { canonicalId: "bharti-airtel-limited", displayName: "Bharti Airtel Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "corporation-bank", displayName: "Corporation Bank", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "care-india", displayName: "CARE India", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "unicef", displayName: "UNICEF", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "world-health-organization-who", displayName: "World Health Organization (WHO)", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "azim-premji-foundation", displayName: "Azim Premji Foundation", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "helpage-india", displayName: "HelpAge India", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "ispat-ltd", displayName: "Ispat Ltd", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "mecon-limited", displayName: "MECON Limited", sectorTab: "government-public-sector", published: false },
  // @review Repeated-entry cue; confirm source cardinality and canonical client ID.
  { canonicalId: "tvs-limited", displayName: "TVS Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "patna-high-court", displayName: "Patna High Court", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bhel", displayName: "BHEL", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "gd-goenka", displayName: "GD Goenka", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bihar-state-electronics-development-corporation-limited", displayName: "Bihar State Electronics Development Corporation Limited", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "rural-works-department-government-of-bihar", displayName: "Rural Works Department, Government of Bihar", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bihar-state-power-holding-company-limited", displayName: "Bihar State Power Holding Company Limited", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "vodafone-limited", displayName: "Vodafone Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "amul", displayName: "Amul", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "aakash-education", displayName: "Aakash Education", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "rourkela-steel-plant", displayName: "Rourkela Steel Plant", sectorTab: "government-public-sector", published: false },
  // @review Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed name, or withhold.
  { canonicalId: "bihar-state-pul-nirman-nigam-limited", displayName: "Bihar State Pul Nirman Nigam Limited", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bihar-state-road-development-corporation-limited", displayName: "Bihar State Road Development Corporation Limited", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "airports-authority-of-india", displayName: "Airports Authority of India", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bameti", displayName: "BAMETI", sectorTab: "government-public-sector", published: false },
  // @review Repeated-entry cue; confirm source cardinality and canonical client ID.
  { canonicalId: "dmi", displayName: "DMI", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "cimp", displayName: "CIMP", sectorTab: "education-social-impact", published: false },
  // @review Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed name, or withhold.
  { canonicalId: "june-elevators", displayName: "June Elevators", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "paradeep-phosphates", displayName: "Paradeep Phosphates", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "cri-pumps", displayName: "CRI Pumps", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bihar-tourism", displayName: "Bihar Tourism", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "income-tax-department", displayName: "Income Tax Department", sectorTab: "government-public-sector", published: false },
  // @review Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed name, or withhold.
  { canonicalId: "bharti-nxtra-limited", displayName: "Bharti Nxtra Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "virbac-animal-health", displayName: "Virbac Animal Health", sectorTab: "corporates-multinationals", published: false },
  // @review Potential duplicate with Tata Motors Limited; merge or keep distinct before publication.
  { canonicalId: "tata-motors", displayName: "Tata Motors", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "essel-power-limited", displayName: "Essel Power Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "janalakshmi-bank-limited", displayName: "Janalakshmi Bank Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "annapurna-bank-limited", displayName: "Annapurna Bank Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bandhan-bank-limited", displayName: "Bandhan Bank Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "syndicate-bank-limited", displayName: "Syndicate Bank Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "united-bank-limited", displayName: "United Bank Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "canara-bank-limited", displayName: "Canara Bank Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "uco-bank-limited", displayName: "UCO Bank Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "can-fin-homes", displayName: "Can Fin Homes", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "sbi-life", displayName: "SBI Life", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "college-of-horticulture", displayName: "College of Horticulture", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "coca-cola", displayName: "Coca-Cola", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "iocl", displayName: "IOCL", sectorTab: "government-public-sector", published: false },
  // @review Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed name, or withhold.
  { canonicalId: "dalmia-dsp-po", displayName: "Dalmia DSP PO", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "steel-authority-of-india-limited", displayName: "Steel Authority of India Limited", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "usha-international-ltd", displayName: "Usha International Ltd", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "building-construction-department", displayName: "Building Construction Department", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "hdfc-limited", displayName: "HDFC Limited", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "hyundai-limited", displayName: "Hyundai Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "livspace-limited", displayName: "Livspace Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "itc-dairy-limited", displayName: "ITC Dairy Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "aiims-patna", displayName: "AIIMS Patna", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "ipac", displayName: "IPAC", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "union-bank-of-india", displayName: "Union Bank of India", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "survey-of-india", displayName: "Survey of India", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "cpwd", displayName: "CPWD", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "maruti-suzuki-limited", displayName: "Maruti Suzuki Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "amara-raja-battery", displayName: "Amara Raja Battery", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "l-and-t-finance-limited", displayName: "L&T Finance Limited", sectorTab: "financial-services", published: false },
  // @review Unclear supplied spelling or entity identity; approve as supplied, approve a reviewed name, or withhold.
  { canonicalId: "itian-limited", displayName: "Itian Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "diageo-limited", displayName: "Diageo Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "standard-chartered-bank", displayName: "Standard Chartered Bank", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "franklin-templeton", displayName: "Franklin Templeton", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "biada-bihar", displayName: "BIADA Bihar", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bihar-foundation", displayName: "Bihar Foundation", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "indian-army", displayName: "Indian Army", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "adani-power", displayName: "Adani Power", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "tourism-department", displayName: "Tourism Department", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "excise-and-customs-department-jamshedpur", displayName: "Excise and Customs Department, Jamshedpur", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "fhi-solutions-llc-bill-and-melinda-gates-foundation", displayName: "FHI Solutions LLC / Bill & Melinda Gates Foundation", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "asian-paints-limited", displayName: "Asian Paints Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "bbc-media-limited", displayName: "BBC Media Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "ricoh-india-limited", displayName: "Ricoh India Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "jeevika", displayName: "JEEViKA", sectorTab: "government-public-sector", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "shriram-commercial-vehicle-finance", displayName: "Shriram Commercial Vehicle Finance", sectorTab: "financial-services", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "crompton-greaves-limited", displayName: "Crompton Greaves Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "micro-focus-limited", displayName: "Micro Focus Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "ultratech-limited", displayName: "UltraTech Limited", sectorTab: "corporates-multinationals", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "iit-patna", displayName: "IIT Patna", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "aditya-birla-school", displayName: "Aditya Birla School", sectorTab: "education-social-impact", published: false },
  // @review Requires publication and sector decisions.
  { canonicalId: "kidzee-school", displayName: "Kidzee School", sectorTab: "education-social-impact", published: false },
];
