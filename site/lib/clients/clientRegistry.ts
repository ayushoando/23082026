import type { ClientRecord, SectorTabId, SectorTabMeta } from "./clientTypes";

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

type SourceClientRecord = Omit<ClientRecord, "sourceNames">;

type SourceClientOptions = {
  canonicalId: string;
  logoPath?: string;
  projectWorkId?: string;
};

function source(
  displayName: string,
  sectorTab: SectorTabId,
  options: SourceClientOptions,
): SourceClientRecord {
  return {
    canonicalId: options.canonicalId,
    displayName,
    sectorTab,
    logoPath: options.logoPath,
    projectWorkId: options.projectWorkId,
    published: false,
  };
}

/**
 * Owner-approved identity groups. Source names remain in each canonical record
 * so review work can trace a public label back to the supplied roster.
 */
export const CLIENT_IDENTITY_MERGES: Readonly<
  Record<string, readonly string[]>
> = {
  sonalika: ["Sonalika", "Sonalika International", "Sonalika Tractors"],
  cimp: ["CIMP", "Chandragupt Institute of Management (CIMP)"],
  dmi: ["DMI", "Development Management Institute (DMI)"],
  "tata-motors": ["Tata Motors", "Tata Motors Limited"],
  bsphcl: ["BSPHCL", "Bihar State Power Holding Company Limited"],
  indianoil: ["IndianOil", "Indian Oil", "IOCL"],
  sail: ["SAIL", "Steel Authority of India Limited"],
  "canara-bank": ["Canara Bank", "Canara Bank Limited"],
  "syndicate-bank": ["Syndicate Bank", "Syndicate Bank Limited"],
  "united-bank": ["United Bank of India", "United Bank Limited"],
  "franklin-templeton": [
    "Franklin Templeton",
    "Franklin Templeton Investments",
  ],
  "asian-paints": ["Asian Paints", "Asian Paints Limited"],
  "maruti-suzuki": ["Maruti Suzuki", "Maruti Suzuki Limited"],
  mecon: ["MECON", "MECON Limited"],
  "usha-international": [
    "Usha",
    "Usha International",
    "Usha International Ltd",
  ],
  "d-goenka-school": ["D. Goenka School", "GD Goenka"],
  "aditya-birla-school": ["Birla School", "Aditya Birla School"],
  "amara-raja": ["Amara Raja", "Amara Raja Battery"],
  janalakshmi: ["Janalakshmi", "Janalakshmi Bank Limited"],
  hyundai: ["Hyundai", "Hyundai Limited"],
  vodafone: ["Vodafone", "Vodafone Limited"],
  "shriram-commercial-vehicle-finance": [
    "Shriram",
    "Shriram Commercial Vehicle Finance",
  ],
  "tvs-group": ["TVS Group", "TVS Limited"],
  titan: ["Titan", "Titan Limited"],
  "customs-and-central-excise": [
    "Customs and Central Excise",
    "Excise and Customs Department, Jamshedpur",
  ],
  "annapurna-finance": ["Annapurna Finance", "Annapurna Bank Limited"],
  "l-and-t-finance-limited": ["L&T", "L&T Finance Limited"],
  "essel-utilities": ["Essel Utilities", "Essel Power Limited"],
  "fhi-360": [
    "FHI 360",
    "FHI Solutions LLC / Bill & Melinda Gates Foundation",
    "Bill & Melinda Gates Foundation",
  ],
  itc: ["ITC Limited", "ITC Dairy Limited"],
  "bbc-media-action": ["BBC Media Action", "BBC Media Limited"],
  "government-of-bihar": [
    "Government of Bihar",
    "Rural Works Department, Government of Bihar",
  ],
  "commercial-tax-department-government-of-india": [
    "Commercial Tax Department, Government of India",
    "Commercial Tax Department",
    "Income Tax Department",
  ],
  "indian-institute-of-technology-iit": [
    "Indian Institute of Technology (IIT)",
    "IIT Patna",
  ],
  "all-india-institute-of-medical-sciences-aiims": [
    "All India Institute of Medical Sciences (AIIMS)",
    "AIIMS Patna",
  ],
  "hdfc-bank": ["HDFC Bank", "HDFC"],
  "bandhan-bank": ["Bandhan Bank", "Bandhan Bank Limited"],
  "bihar-tourism": [
    "Bihar Tourism",
    "Tourism Department",
    "Department of Tourism, Bihar",
  ],
};

const SOURCE_NAME_TO_CANONICAL_ID = new Map<string, string>();
for (const [canonicalId, sourceNames] of Object.entries(
  CLIENT_IDENTITY_MERGES,
)) {
  for (const sourceName of sourceNames) {
    SOURCE_NAME_TO_CANONICAL_ID.set(sourceName, canonicalId);
  }
}

const SOURCE_CLIENT_RECORDS: SourceClientRecord[] = [
  // ── Financial Services ──────────────────────────────────────────────────
  source("State Bank of India", "financial-services", {
    canonicalId: "state-bank-of-india",
    logoPath: "/assets/marketing/client-logos/state-bank-of-india.svg",
  }), // @review
  source("Tata Motors Limited", "corporates-multinationals", {
    canonicalId: "tata-motors-limited",
    logoPath: "/assets/marketing/client-logos/tata-motors.svg",
  }), // @review — merge with Tata Motors under one canonical identity.
  source("Bharti Airtel Limited", "corporates-multinationals", {
    canonicalId: "bharti-airtel-limited",
    logoPath: "/assets/marketing/client-logos/airtel.svg",
  }),
  source("Corporation Bank", "financial-services", {
    canonicalId: "corporation-bank",
    logoPath: "/assets/marketing/client-logos/corporation-bank.jpg",
  }), // @review
  source("CARE India", "education-social-impact", {
    canonicalId: "care-india",
    logoPath: "/assets/marketing/client-logos/care-india.svg",
  }),
  source("UNICEF", "education-social-impact", {
    canonicalId: "unicef",
    logoPath: "/assets/marketing/client-logos/unicef.svg",
  }),
  source("World Health Organization (WHO)", "education-social-impact", {
    canonicalId: "world-health-organization-who",
    logoPath: "/assets/marketing/client-logos/world-health-organization-who.svg",
  }),
  source("Azim Premji Foundation", "education-social-impact", {
    canonicalId: "azim-premji-foundation",
    logoPath: "/assets/marketing/client-logos/azim-premji-foundation.png",
  }),
  source("HelpAge India", "education-social-impact", {
    canonicalId: "helpage-india",
    logoPath: "/assets/marketing/client-logos/helpage-india.svg",
  }),
  source("Ispat Ltd", "corporates-multinationals", {
    canonicalId: "ispat-ltd",
    logoPath: "/assets/marketing/client-logos/ispat-industries.svg",
  }),
  source("MECON Limited", "corporates-multinationals", {
    canonicalId: "mecon-limited",
    logoPath: "/assets/marketing/client-logos/mecon-limited.jpg",
  }), // @review
  source("TVS Limited", "corporates-multinationals", {
    canonicalId: "tvs-limited",
    logoPath: "/assets/marketing/client-logos/tvs-motor.svg",
  }),
  source("Patna High Court", "government-public-sector", {
    canonicalId: "patna-high-court",
    logoPath: "/assets/marketing/client-logos/patna-high-court.png",
  }),
  source("BHEL", "government-public-sector", {
    canonicalId: "bhel",
    logoPath: "/assets/marketing/client-logos/bhel.svg",
  }), // @review
  source("GD Goenka", "education-social-impact", {
    canonicalId: "gd-goenka",
    logoPath: "/assets/marketing/client-logos/gd-goenka.jpg",
  }), // @review
  source(
    "Bihar State Electronics Development Corporation Limited",
    "government-public-sector",
    {
      canonicalId: "bihar-state-electronics-development-corporation-limited",
      logoPath: "/assets/marketing/client-logos/beltron-bihar.svg",
    },
  ),
  source(
    "Rural Works Department, Government of Bihar",
    "government-public-sector",
    {
      canonicalId: "rural-works-department-government-of-bihar",
      logoPath: "/assets/marketing/client-logos/government-of-bihar.jpg",
    },
  ), // @review
  source(
    "Bihar State Power Holding Company Limited",
    "government-public-sector",
    {
      canonicalId: "bihar-state-power-holding-company-limited",
      logoPath: "/assets/marketing/client-logos/bsphcl.jpg",
    },
  ), // @review
  source("Vodafone Limited", "corporates-multinationals", {
    canonicalId: "vodafone-limited",
    logoPath: "/assets/marketing/client-logos/vodafone.svg",
  }),
  source("Amul", "corporates-multinationals", {
    canonicalId: "amul",
    logoPath: "/assets/marketing/client-logos/amul.svg",
  }),
  source("Aakash Education", "corporates-multinationals", {
    canonicalId: "aakash-education",
    logoPath: "/assets/marketing/client-logos/aakash-education.png",
  }),
  source("Rourkela Steel Plant", "government-public-sector", {
    canonicalId: "rourkela-steel-plant",
    logoPath: "/assets/marketing/client-logos/rourkela-steel-plant.svg",
  }),
  source("Bihar State Pul Nirman Nigam Limited", "government-public-sector", {
    canonicalId: "bihar-state-pul-nirman-nigam-limited",
    logoPath: "/assets/marketing/client-logos/brpnnl.svg",
  }),
  source(
    "Bihar State Road Development Corporation Limited",
    "government-public-sector",
    {
      canonicalId: "bihar-state-road-development-corporation-limited",
      logoPath: "/assets/marketing/client-logos/bsrdcl.svg",
    },
  ),
  source("Airports Authority of India", "government-public-sector", {
    canonicalId: "airports-authority-of-india",
    logoPath: "/assets/marketing/client-logos/airports-authority-of-india.svg",
  }),
  source("BAMETI", "government-public-sector", {
    canonicalId: "bameti",
    logoPath: "/assets/marketing/client-logos/bameti.svg",
  }),
  source("DMI", "corporates-multinationals", {
    canonicalId: "dmi",
    logoPath: "/assets/marketing/client-logos/dmi.svg",
  }),
  source("CIMP", "education-social-impact", {
    canonicalId: "cimp",
    logoPath: "/assets/marketing/client-logos/cimp.svg",
  }),
  source("June Elevators", "corporates-multinationals", {
    canonicalId: "june-elevators",
    logoPath: "/assets/marketing/client-logos/june-elevators.svg",
  }),
  source("Paradeep Phosphates", "corporates-multinationals", {
    canonicalId: "paradeep-phosphates",
    logoPath: "/assets/marketing/client-logos/paradeep-phosphates.jpg",
  }), // @review
  source("CRI Pumps", "corporates-multinationals", {
    canonicalId: "cri-pumps",
    logoPath: "/assets/marketing/client-logos/cri-pumps.jpg",
  }), // @review
  source("Bihar Tourism", "government-public-sector", {
    canonicalId: "bihar-tourism",
    logoPath: "/assets/marketing/client-logos/bihar-tourism.svg",
  }),
  source("Income Tax Department", "government-public-sector", {
    canonicalId: "income-tax-department",
    logoPath: "/assets/marketing/client-logos/income-tax-department.png",
  }), // @review
  source("Bharti Nxtra Limited", "corporates-multinationals", {
    canonicalId: "bharti-nxtra-limited",
    logoPath: "/assets/marketing/client-logos/nxtra-airtel.svg",
  }),
  source("Virbac Animal Health", "corporates-multinationals", {
    canonicalId: "virbac-animal-health",
    logoPath: "/assets/marketing/client-logos/virbac.svg",
  }),
  source("Tata Motors", "corporates-multinationals", {
    canonicalId: "tata-motors",
    logoPath: "/assets/marketing/client-logos/tata-motors.svg",
  }), // @review — merge with Tata Motors Limited under one canonical identity.
  source("Essel Power Limited", "corporates-multinationals", {
    canonicalId: "essel-power-limited",
    logoPath: "/assets/marketing/client-logos/essel-utilities.jpg",
  }), // @review
  source("Janalakshmi Bank Limited", "financial-services", {
    canonicalId: "janalakshmi",
    logoPath: "/assets/marketing/client-logos/janalakshmi.jpg",
  }),
  source("Annapurna Bank Limited", "financial-services", {
    canonicalId: "annapurna-bank-limited",
    logoPath: "/assets/marketing/client-logos/annapurna-finance.jpg",
  }), // @review
  source("Bandhan Bank Limited", "financial-services", {
    canonicalId: "bandhan-bank",
    logoPath: "/assets/marketing/client-logos/bandhan-bank.svg",
  }),
  source("Syndicate Bank Limited", "financial-services", {
    canonicalId: "syndicate-bank-limited",
    logoPath: "/assets/marketing/client-logos/syndicate-bank-limited.png",
  }), // @review
  source("United Bank Limited", "financial-services", {
    canonicalId: "united-bank-limited",
    logoPath: "/assets/marketing/client-logos/united-bank-limited.png",
  }), // @review
  source("Canara Bank Limited", "financial-services", {
    canonicalId: "canara-bank-limited",
    logoPath: "/assets/marketing/client-logos/canara-bank-limited.svg",
  }), // @review
  source("UCO Bank Limited", "financial-services", {
    canonicalId: "uco-bank-limited",
    logoPath: "/assets/marketing/client-logos/uco-bank.jpg",
  }),
  source("Can Fin Homes", "financial-services", {
    canonicalId: "can-fin-homes",
    logoPath: "/assets/marketing/client-logos/can-fin-homes.svg",
  }),
  source("SBI Life", "financial-services", {
    canonicalId: "sbi-life",
    logoPath: "/assets/marketing/client-logos/sbi-life.svg",
  }),
  source("College of Horticulture", "education-social-impact", {
    canonicalId: "college-of-horticulture",
    logoPath: "/assets/marketing/client-logos/college-of-horticulture.png",
  }),
  source("Coca-Cola", "corporates-multinationals", {
    canonicalId: "coca-cola",
    logoPath: "/assets/marketing/client-logos/coca-cola.svg",
  }), // @review
  source("IOCL", "government-public-sector", {
    canonicalId: "iocl",
    logoPath: "/assets/marketing/client-logos/iocl.svg",
  }), // @review
  source("Dalmia DSP PO", "education-social-impact", {
    canonicalId: "dalmia-dsp-po",
    logoPath: "/assets/marketing/client-logos/dalmia-dsp-po.svg",
  }),
  source("Steel Authority of India Limited", "government-public-sector", {
    canonicalId: "steel-authority-of-india-limited",
    logoPath:
      "/assets/marketing/client-logos/steel-authority-of-india-limited.png",
  }), // @review
  source("Usha International Ltd", "corporates-multinationals", {
    canonicalId: "usha-international-ltd",
    logoPath: "/assets/marketing/client-logos/usha-international-ltd.png",
  }), // @review
  source("Building Construction Department", "government-public-sector", {
    canonicalId: "building-construction-department",
    logoPath: "/assets/marketing/client-logos/building-construction-department.svg",
  }),
  source("HDFC Limited", "financial-services", {
    canonicalId: "hdfc-limited",
    logoPath: "/assets/marketing/client-logos/hdfc-limited.jpg",
  }), // @review — keep separate from HDFC Bank and HDFC Mutual Fund.
  source("Hyundai Limited", "corporates-multinationals", {
    canonicalId: "hyundai-limited",
    logoPath: "/assets/marketing/client-logos/hyundai-limited.jpg",
  }), // @review
  source("Livspace Limited", "corporates-multinationals", {
    canonicalId: "livspace-limited",
    logoPath: "/assets/marketing/client-logos/livspace.svg",
  }),
  source("ITC Dairy Limited", "corporates-multinationals", {
    canonicalId: "itc",
    logoPath: "/assets/marketing/client-logos/itc-limited.svg",
  }),
  source("AIIMS Patna", "education-social-impact", {
    canonicalId: "all-india-institute-of-medical-sciences-aiims",
    logoPath: "/assets/marketing/client-logos/aiims.svg",
  }),
  source("IPAC", "education-social-impact", {
    canonicalId: "ipac",
    logoPath: "/assets/marketing/client-logos/ipac.svg",
  }),
  source("Union Bank of India", "financial-services", {
    canonicalId: "union-bank-of-india",
    logoPath: "/assets/marketing/client-logos/union-bank-of-india.svg",
  }), // @review
  source("Survey of India", "government-public-sector", {
    canonicalId: "survey-of-india",
    logoPath: "/assets/marketing/client-logos/survey-of-india.jpg",
  }), // @review
  source("CPWD", "government-public-sector", {
    canonicalId: "cpwd",
    logoPath: "/assets/marketing/client-logos/cpwd.png",
  }),
  source("Maruti Suzuki Limited", "corporates-multinationals", {
    canonicalId: "maruti-suzuki-limited",
    logoPath: "/assets/marketing/client-logos/maruti-suzuki-limited.png",
  }), // @review
  source("Amara Raja Battery", "corporates-multinationals", {
    canonicalId: "amara-raja",
    logoPath: "/assets/marketing/client-logos/amara-raja.svg",
  }),
  source("L&T Finance Limited", "financial-services", {
    canonicalId: "l-and-t-finance-limited",
    logoPath: "/assets/marketing/client-logos/l-and-t-finance-limited.png",
  }), // @review
  source("Itian Limited", "corporates-multinationals", {
    canonicalId: "itian-limited",
    logoPath: "/assets/marketing/client-logos/itian.svg",
  }),
  source("Diageo Limited", "corporates-multinationals", {
    canonicalId: "diageo-limited",
    logoPath: "/assets/marketing/client-logos/diageo.svg",
  }),
  source("Standard Chartered Bank", "financial-services", {
    canonicalId: "standard-chartered-bank",
    logoPath: "/assets/marketing/client-logos/standard-chartered.svg",
  }),
  source("Franklin Templeton", "financial-services", {
    canonicalId: "franklin-templeton",
    logoPath: "/assets/marketing/client-logos/franklin-templeton.jpg",
  }), // @review
  source("BIADA Bihar", "government-public-sector", {
    canonicalId: "biada-bihar",
    logoPath: "/assets/marketing/client-logos/biada-bihar.svg",
  }),
  source("Bihar Foundation", "government-public-sector", {
    canonicalId: "bihar-foundation",
    logoPath: "/assets/marketing/client-logos/bihar-foundation.svg",
  }),
  source("Indian Army", "government-public-sector", {
    canonicalId: "indian-army",
    logoPath: "/assets/marketing/client-logos/indian-army.svg",
  }),
  source("Adani Power", "corporates-multinationals", {
    canonicalId: "adani-power",
    logoPath: "/assets/marketing/client-logos/adani-power.svg",
  }),
  source("Tourism Department", "government-public-sector", {
    canonicalId: "bihar-tourism",
    logoPath: "/assets/marketing/client-logos/bihar-tourism.svg",
  }),
  source(
    "Excise and Customs Department, Jamshedpur",
    "government-public-sector",
    {
      canonicalId: "excise-and-customs-department-jamshedpur",
      logoPath: "/assets/marketing/client-logos/customs-and-central-excise.jpg",
    },
  ), // @review
  source(
    "FHI Solutions LLC / Bill & Melinda Gates Foundation",
    "education-social-impact",
    {
      canonicalId: "fhi-solutions-llc-bill-and-melinda-gates-foundation",
      logoPath: "/assets/marketing/client-logos/fhi-360.png",
    },
  ), // @review
  source("Asian Paints Limited", "corporates-multinationals", {
    canonicalId: "asian-paints-limited",
    logoPath: "/assets/marketing/client-logos/asian-paints-limited.svg",
  }), // @review
  source("BBC Media Limited", "corporates-multinationals", {
    canonicalId: "bbc-media-action",
    logoPath: "/assets/marketing/client-logos/bbc-media-action.svg",
  }),
  source("Ricoh India Limited", "corporates-multinationals", {
    canonicalId: "ricoh-india-limited",
    logoPath: "/assets/marketing/client-logos/ricoh.svg",
  }),
  source("JEEViKA", "government-public-sector", {
    canonicalId: "jeevika",
    logoPath: "/assets/marketing/client-logos/jeevika.svg",
  }),
  source("Shriram Commercial Vehicle Finance", "financial-services", {
    canonicalId: "shriram-commercial-vehicle-finance",
    logoPath:
      "/assets/marketing/client-logos/shriram-commercial-vehicle-finance.png",
  }), // @review
  source("Crompton Greaves Limited", "corporates-multinationals", {
    canonicalId: "crompton-greaves-limited",
    logoPath: "/assets/marketing/client-logos/crompton-greaves.svg",
  }),
  source("Micro Focus Limited", "corporates-multinationals", {
    canonicalId: "micro-focus-limited",
    logoPath: "/assets/marketing/client-logos/micro-focus.svg",
  }),
  source("UltraTech Limited", "corporates-multinationals", {
    canonicalId: "ultratech-limited",
    logoPath: "/assets/marketing/client-logos/ultratech-cement.svg",
  }),
  source("IIT Patna", "education-social-impact", {
    canonicalId: "indian-institute-of-technology-iit",
    logoPath: "/assets/marketing/client-logos/iit-patna.svg",
  }),
  source("Aditya Birla School", "education-social-impact", {
    canonicalId: "aditya-birla-school",
    logoPath: "/assets/marketing/client-logos/aditya-birla-schools.svg",
  }),
  source("Kidzee School", "education-social-impact", {
    canonicalId: "kidzee-school",
    logoPath: "/assets/marketing/client-logos/kidzee.svg",
  }),
];

/** Additional source records already present in the public client proof copy. */
const ADDITIONAL_SOURCE_CLIENT_RECORDS: SourceClientRecord[] = [
  source("Adecco", "corporates-multinationals", {
    canonicalId: "adecco",
    logoPath: "/assets/marketing/client-logos/adecco.svg",
  }),
  source("Ambuja Neotia", "corporates-multinationals", {
    canonicalId: "ambuja-neotia",
    logoPath: "/assets/marketing/client-logos/ambuja-neotia.png",
  }), // @review
  source("Bureau of Indian Standards", "government-public-sector", {
    canonicalId: "bureau-of-indian-standards",
    logoPath: "/assets/marketing/client-logos/bureau-of-indian-standards.jpg",
  }), // @review
  source("BNP Paribas", "financial-services", {
    canonicalId: "bnp-paribas",
    logoPath: "/assets/marketing/client-logos/bnp-paribas.svg",
  }),
  source("Bandhan Bank", "financial-services", {
    canonicalId: "bandhan-bank",
    logoPath: "/assets/marketing/client-logos/bandhan-bank.svg",
  }),
  source("Big Bazaar", "corporates-multinationals", {
    canonicalId: "big-bazaar",
    logoPath: "/assets/marketing/client-logos/big-bazaar.svg",
  }),
  source("DMRC", "government-public-sector", {
    canonicalId: "dmrc",
    projectWorkId: "dmrc",
    logoPath: "/assets/marketing/client-logos/dmrc.svg",
  }),
  source("Dalmia Bharat Cement", "corporates-multinationals", {
    canonicalId: "dalmia-bharat-cement",
    logoPath: "/assets/marketing/client-logos/dalmia-bharat-cement.svg",
  }),
  source("HDFC Bank", "financial-services", {
    canonicalId: "hdfc-bank",
    logoPath: "/assets/marketing/client-logos/hdfc-limited.jpg",
  }), // @review — preserve separately from HDFC Limited.
  source("IDBI Bank", "financial-services", {
    canonicalId: "idbi-bank",
    logoPath: "/assets/marketing/client-logos/idbi-bank.png",
  }), // @review
  source("Indian Bank", "financial-services", {
    canonicalId: "indian-bank",
    logoPath: "/assets/marketing/client-logos/indian-bank.png",
  }),
  source("JSW", "corporates-multinationals", {
    canonicalId: "jsw",
    logoPath: "/assets/marketing/client-logos/jsw.png",
  }), // @review
  source("NTPC", "government-public-sector", {
    canonicalId: "ntpc",
    logoPath: "/assets/marketing/client-logos/ntpc.svg",
  }),
  source("NABARD", "financial-services", {
    canonicalId: "nabard",
    logoPath: "/assets/marketing/client-logos/nabard.png",
  }),
  source("SITI Networks", "corporates-multinationals", {
    canonicalId: "siti-networks",
    logoPath: "/assets/marketing/client-logos/siti-networks.png",
  }), // @review
  source("Sonalika International", "corporates-multinationals", {
    canonicalId: "sonalika",
    logoPath: "/assets/marketing/client-logos/sonalika.jpg",
  }), // @review
  source("Tata Steel", "corporates-multinationals", {
    canonicalId: "tata-steel",
    logoPath: "/assets/marketing/client-logos/tata-steel.svg",
  }),
  source("Titan", "corporates-multinationals", {
    canonicalId: "titan",
    logoPath: "/assets/marketing/client-logos/titan-limited.png",
    projectWorkId: "titan",
  }), // @review
  source("United Nations", "education-social-impact", {
    canonicalId: "united-nations",
    logoPath: "/assets/marketing/client-logos/united-nations.svg",
  }),
  source("Ujjivan Small Finance Bank", "financial-services", {
    canonicalId: "ujjivan-small-finance-bank",
    logoPath: "/assets/marketing/client-logos/ujjivan-small-finance-bank.jpg",
  }), // @review
  source("United Spirits", "corporates-multinationals", {
    canonicalId: "united-spirits",
    logoPath: "/assets/marketing/client-logos/united-spirits.svg",
  }),
  source("ZTE", "corporates-multinationals", {
    canonicalId: "zte",
    logoPath: "/assets/marketing/client-logos/zte.svg",
  }),
  source(
    "Commercial Tax Department, Government of India",
    "government-public-sector",
    {
      canonicalId: "commercial-tax-department-government-of-india",
      logoPath: "/assets/marketing/client-logos/income-tax-department.png",
    },
  ),
  source("HDFC Mutual Fund", "financial-services", {
    canonicalId: "hdfc-mutual-fund",
    logoPath: "/assets/marketing/client-logos/hdfc-mutual-fund.svg",
  }),
  source("Coca-Cola", "corporates-multinationals", {
    canonicalId: "coca-cola",
    logoPath: "/assets/marketing/client-logos/coca-cola.svg",
  }),
  source("Union Bank of India", "financial-services", {
    canonicalId: "union-bank-of-india",
    logoPath: "/assets/marketing/client-logos/union-bank-of-india.svg",
  }),
  source("CRI Pumps", "corporates-multinationals", {
    canonicalId: "cri-pumps",
    logoPath: "/assets/marketing/client-logos/cri-pumps.jpg",
  }),
  source("Paradeep Phosphates", "corporates-multinationals", {
    canonicalId: "paradeep-phosphates",
    logoPath: "/assets/marketing/client-logos/paradeep-phosphates.jpg",
  }),
  source("Survey of India", "government-public-sector", {
    canonicalId: "survey-of-india",
    logoPath: "/assets/marketing/client-logos/survey-of-india.jpg",
  }),
  source("Reliance Industries", "corporates-multinationals", {
    canonicalId: "reliance-industries",
    logoPath: "/assets/marketing/client-logos/reliance-industries.svg",
  }),
  source("Vedanta Limited", "corporates-multinationals", {
    canonicalId: "vedanta-limited",
    logoPath: "/assets/marketing/client-logos/vedanta.svg",
  }),
  source("Hindalco Industries", "corporates-multinationals", {
    canonicalId: "hindalco-industries",
    logoPath: "/assets/marketing/client-logos/hindalco.svg",
  }),
  source("Grasim Industries", "corporates-multinationals", {
    canonicalId: "grasim-industries",
    logoPath: "/assets/marketing/client-logos/grasim-aditya-birla.svg",
  }),
  source("Mahindra & Mahindra", "corporates-multinationals", {
    canonicalId: "mahindra-and-mahindra",
    logoPath: "/assets/marketing/client-logos/mahindra.svg",
  }),
  source("Godrej & Boyce", "corporates-multinationals", {
    canonicalId: "godrej-and-boyce",
    logoPath: "/assets/marketing/client-logos/godrej-and-boyce.svg",
  }),
  source("Escorts Limited", "corporates-multinationals", {
    canonicalId: "escorts-limited",
    logoPath: "/assets/marketing/client-logos/escorts-kubota.svg",
  }),
  source("Havells India", "corporates-multinationals", {
    canonicalId: "havells-india",
    logoPath: "/assets/marketing/client-logos/havells.svg",
  }),
  source("Schneider Electric", "corporates-multinationals", {
    canonicalId: "schneider-electric",
    logoPath: "/assets/marketing/client-logos/schneider-electric.svg",
  }),
];

const CANONICAL_OVERRIDES: Readonly<
  Record<
    string,
    Partial<
      Pick<
        ClientRecord,
        "displayName" | "sectorTab" | "logoPath" | "projectWorkId"
      >
    >
  >
> = {
  "bandhan-bank": {
    displayName: "Bandhan Bank",
    sectorTab: "financial-services",
    logoPath: "/assets/marketing/client-logos/bandhan-bank.svg",
  },
  "bihar-tourism": {
    displayName: "Bihar Tourism",
    sectorTab: "government-public-sector",
    logoPath: "/assets/marketing/client-logos/bihar-tourism.svg",
  },
  sonalika: {
    displayName: "Sonalika",
    logoPath: "/assets/marketing/client-logos/sonalika.jpg",
  },
  cimp: {
    displayName: "Chandragupt Institute of Management (CIMP)",
    logoPath: "/assets/marketing/client-logos/cimp.svg",
  },
  dmi: {
    displayName: "Development Management Institute (DMI)",
    logoPath: "/assets/marketing/client-logos/dmi.svg",
  },
  "tata-motors": {
    displayName: "Tata Motors",
    logoPath: "/assets/marketing/client-logos/tata-motors.svg",
  },
  bsphcl: {
    displayName: "Bihar State Power Holding Company Limited",
    logoPath: "/assets/marketing/client-logos/bsphcl.jpg",
  },
  indianoil: {
    displayName: "IndianOil",
    logoPath: "/assets/marketing/client-logos/iocl.svg",
  },
  sail: {
    displayName: "SAIL",
    logoPath:
      "/assets/marketing/client-logos/steel-authority-of-india-limited.png",
  },
  "canara-bank": {
    displayName: "Canara Bank",
    logoPath: "/assets/marketing/client-logos/canara-bank-limited.svg",
  },
  "syndicate-bank": {
    displayName: "Syndicate Bank",
    logoPath: "/assets/marketing/client-logos/syndicate-bank-limited.png",
  },
  "united-bank": {
    displayName: "United Bank of India",
    logoPath: "/assets/marketing/client-logos/united-bank-limited.png",
  },
  "franklin-templeton": {
    displayName: "Franklin Templeton",
    projectWorkId: "franklin-templeton",
    logoPath: "/assets/marketing/client-logos/franklin-templeton.jpg",
  },
  "asian-paints": {
    displayName: "Asian Paints",
    logoPath: "/assets/marketing/client-logos/asian-paints-limited.svg",
  },
  "maruti-suzuki": {
    displayName: "Maruti Suzuki",
    logoPath: "/assets/marketing/client-logos/maruti-suzuki-limited.png",
  },
  mecon: {
    displayName: "MECON",
    logoPath: "/assets/marketing/client-logos/mecon-limited.jpg",
  },
  "usha-international": {
    displayName: "Usha International",
    projectWorkId: "usha",
    logoPath: "/assets/marketing/client-logos/usha-international-ltd.png",
  },
  "d-goenka-school": {
    displayName: "D. Goenka School",
    logoPath: "/assets/marketing/client-logos/gd-goenka.jpg",
  },
  "aditya-birla-school": {
    displayName: "Birla School",
    logoPath: "/assets/marketing/client-logos/aditya-birla-schools.svg",
  },
  "amara-raja": {
    displayName: "Amara Raja",
    logoPath: "/assets/marketing/client-logos/amara-raja.svg",
  },
  janalakshmi: {
    displayName: "Janalakshmi",
    logoPath: "/assets/marketing/client-logos/janalakshmi.jpg",
  },
  hyundai: {
    displayName: "Hyundai",
    logoPath: "/assets/marketing/client-logos/hyundai-limited.jpg",
  },
  vodafone: {
    displayName: "Vodafone",
    logoPath: "/assets/marketing/client-logos/vodafone.svg",
  },
  "shriram-commercial-vehicle-finance": {
    displayName: "Shriram",
    logoPath:
      "/assets/marketing/client-logos/shriram-commercial-vehicle-finance.png",
  },
  "tvs-group": {
    displayName: "TVS Group",
    projectWorkId: "tvs",
    sectorTab: "corporates-multinationals",
    logoPath: "/assets/marketing/client-logos/tvs-motor.svg",
  },
  titan: {
    displayName: "Titan",
    sectorTab: "corporates-multinationals",
    projectWorkId: "titan",
    logoPath: "/assets/marketing/client-logos/titan-limited.png",
  },
  "customs-and-central-excise": {
    displayName: "Customs and Central Excise",
    logoPath: "/assets/marketing/client-logos/customs-and-central-excise.jpg",
  },
  "annapurna-finance": {
    displayName: "Annapurna Finance",
    logoPath: "/assets/marketing/client-logos/annapurna-finance.jpg",
  },
  "l-and-t-finance-limited": {
    displayName: "L&T",
    logoPath: "/assets/marketing/client-logos/l-and-t-finance-limited.png",
  },
  "essel-utilities": {
    displayName: "Essel Utilities",
    logoPath: "/assets/marketing/client-logos/essel-utilities.jpg",
  },
  "fhi-360": {
    displayName: "FHI 360",
    logoPath: "/assets/marketing/client-logos/fhi-360.png",
  },
  itc: {
    displayName: "ITC Limited",
    logoPath: "/assets/marketing/client-logos/itc-limited.svg",
  },
  "bbc-media-action": {
    displayName: "BBC Media Action",
    logoPath: "/assets/marketing/client-logos/bbc-media-action.svg",
  },
  "government-of-bihar": {
    displayName: "Government of Bihar",
    projectWorkId: "government",
    logoPath: "/assets/marketing/client-logos/government-of-bihar.jpg",
  },
  "commercial-tax-department-government-of-india": {
    displayName: "Commercial Tax Department, Government of India",
    logoPath: "/assets/marketing/client-logos/income-tax-department.png",
  },
  "indian-institute-of-technology-iit": {
    displayName: "Indian Institute of Technology (IIT)",
    sectorTab: "education-social-impact",
    logoPath: "/assets/marketing/client-logos/iit-patna.svg",
  },
  "all-india-institute-of-medical-sciences-aiims": {
    displayName: "All India Institute of Medical Sciences (AIIMS)",
    sectorTab: "education-social-impact",
    logoPath: "/assets/marketing/client-logos/aiims.svg",
  },
  "hdfc-bank": {
    displayName: "HDFC Bank",
    sectorTab: "financial-services",
    logoPath: "/assets/marketing/client-logos/hdfc-limited.jpg",
  },
};

export const CURATED_LOGO_CLIENT_IDS = [
  "ambuja-neotia",
  "annapurna-finance",
  "bsphcl",
  "bureau-of-indian-standards",
  "canara-bank",
  "corporation-bank",
  "cri-pumps",
  "customs-and-central-excise",
  "d-goenka-school",
  "essel-utilities",
  "fhi-360",
  "franklin-templeton",
  "government-of-bihar",
  "hdfc-bank",
  "hyundai",
  "idbi-bank",
  "commercial-tax-department-government-of-india",
  "indianoil",
  "jsw",
  "l-and-t-finance-limited",
  "maruti-suzuki",
  "mecon",
  "paradeep-phosphates",
  "sail",
  "shriram-commercial-vehicle-finance",
  "siti-networks",
  "sonalika",
  "survey-of-india",
  "syndicate-bank",
  "tata-motors",
  "titan",
  "ujjivan-small-finance-bank",
  "united-bank",
  "usha-international",
] as const;

const _PUBLIC_CANONICAL_IDS = new Set<string>([
  ...CURATED_LOGO_CLIENT_IDS,
  "tvs-group",
  "dmrc",
]);

function buildCanonicalRegistry(
  sourceRecords: readonly SourceClientRecord[],
): ClientRecord[] {
  const grouped = new Map<string, SourceClientRecord[]>();

  for (const sourceRecord of sourceRecords) {
    const canonicalId =
      SOURCE_NAME_TO_CANONICAL_ID.get(sourceRecord.displayName) ??
      sourceRecord.canonicalId;
    const records = grouped.get(canonicalId) ?? [];
    records.push(sourceRecord);
    grouped.set(canonicalId, records);
  }

  const registry: ClientRecord[] = [];
  const emitted = new Set<string>();

  for (const sourceRecord of sourceRecords) {
    const canonicalId =
      SOURCE_NAME_TO_CANONICAL_ID.get(sourceRecord.displayName) ??
      sourceRecord.canonicalId;
    if (emitted.has(canonicalId)) {
      continue;
    }

    const records = grouped.get(canonicalId) ?? [sourceRecord];
    const override = CANONICAL_OVERRIDES[canonicalId] ?? {};
    const sourceNames = Array.from(
      new Set([
        ...(CLIENT_IDENTITY_MERGES[canonicalId] ?? []),
        ...records.map((record) => record.displayName),
      ]),
    );
    const logoPath =
      override.logoPath ?? records.find((record) => record.logoPath)?.logoPath;
    const projectWorkId =
      override.projectWorkId ??
      records.find((record) => record.projectWorkId)?.projectWorkId;

    registry.push({
      canonicalId,
      displayName: override.displayName ?? records[0].displayName,
      sourceNames,
      sectorTab: override.sectorTab ?? records[0].sectorTab,
      ...(logoPath ? { logoPath } : {}),
      published: true,
      ...(projectWorkId ? { projectWorkId } : {}),
    });
    emitted.add(canonicalId);
  }

  return registry;
}

/** Canonical working universe: 116 records after the approved identity merges. */
export const CLIENT_REGISTRY: ClientRecord[] = buildCanonicalRegistry([
  ...SOURCE_CLIENT_RECORDS,
  ...ADDITIONAL_SOURCE_CLIENT_RECORDS,
]);

export function getClientRecord(canonicalId: string): ClientRecord | undefined {
  return CLIENT_REGISTRY.find((record) => record.canonicalId === canonicalId);
}

export function getCuratedLogoRecords(): ClientRecord[] {
  return CURATED_LOGO_CLIENT_IDS.map((canonicalId) =>
    getClientRecord(canonicalId),
  ).filter((record): record is ClientRecord => Boolean(record));
}

export function getPublishedRecords(): ClientRecord[] {
  return CLIENT_REGISTRY.filter((record) => record.published);
}

/**
 * Pure grouping core: sorts by `displayName` with `en-IN` collation
 * (`canonicalId` tiebreaker), keeps at most one entry per `canonicalId`, and
 * always returns all four sector keys. Exported so property tests can drive
 * it with generated records; callers should use `getGroupedRecords()`.
 */
export function groupPublishedRecords(
  records: readonly ClientRecord[],
): Record<SectorTabId, ClientRecord[]> {
  const collator = new Intl.Collator("en-IN");
  const grouped = {} as Record<SectorTabId, ClientRecord[]>;

  for (const tab of SECTOR_TABS) {
    const seen = new Set<string>();
    grouped[tab.id] = records
      .filter((record) => record.published && record.sectorTab === tab.id)
      .sort((left, right) => {
        const nameOrder = collator.compare(left.displayName, right.displayName);
        return nameOrder || left.canonicalId.localeCompare(right.canonicalId);
      })
      .filter((record) => {
        if (seen.has(record.canonicalId)) {
          return false;
        }
        seen.add(record.canonicalId);
        return true;
      });
  }

  return grouped;
}

export function getGroupedRecords(): Record<SectorTabId, ClientRecord[]> {
  return groupPublishedRecords(getPublishedRecords());
}
