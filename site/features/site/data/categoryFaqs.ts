export interface CategoryFaqItem {
  question: string;
  answer: string;
}

export const CATEGORY_FAQS: Record<string, CategoryFaqItem[]> = {
  workstations: [
    {
      question: "Are One&Only modular workstations customizable for different office layouts?",
      answer:
        "Yes. One&Only modular workstations are built on flexible frame architectures supporting 120-degree pods, linear benching, back-to-back clusters, and height-adjustable desking with integrated cable management.",
    },
    {
      question: "What quality certifications and standards do One&Only workstations meet?",
      answer:
        "Our commercial workstations comply with BIFMA X5.5 desk standards, ISO 9001 quality management, and ISO 14001 environmental benchmarks, utilizing high-grade pre-laminated boards and CRCA steel frames.",
    },
    {
      question: "What is the typical manufacturing and delivery lead time across India?",
      answer:
        "Standard workstation systems ship within 10 to 14 business days across major hubs in India including Patna, Bengaluru, Delhi NCR, Mumbai, and Hyderabad, with dedicated on-site installation support.",
    },
    {
      question: "What warranty coverage is included with One&Only workstations?",
      answer:
        "All commercial workstations include a comprehensive 5-year structural manufacturer warranty covering frames, raceways, structural joins, and desk surfaces.",
    },
  ],
  seating: [
    {
      question: "How do One&Only ergonomic office chairs support posture and spine alignment?",
      answer:
        "Our task and executive chairs feature multi-point dynamic lumbar support, synchronized tilt mechanisms, adjustable 3D/4D armrests, and breathable high-tensile mesh designed for 8+ hours of continuous ergonomic seating.",
    },
    {
      question: "Are One&Only office chairs BIFMA certified?",
      answer:
        "Yes, our task and executive seating collections undergo rigorous BIFMA X5.1 structural and durability testing, rated for commercial users up to 135 kg (300 lbs).",
    },
    {
      question: "What upholstery and color options are available for corporate orders?",
      answer:
        "We offer high-rub-count commercial fabrics, premium breathable mesh, and certified faux and genuine leather finishes in a wide palette of corporate colors.",
    },
    {
      question: "What warranty is provided on ergonomic seating?",
      answer:
        "Our chairs come with a 3 to 5-year commercial warranty covering gas lift cylinders, tilt mechanisms, casters, and frame integrity.",
    },
  ],
  tables: [
    {
      question: "Do One&Only conference and meeting tables support integrated AV and power modules?",
      answer:
        "Yes. All conference and boardroom tables feature integrated flip-top pop-up power boxes, HDMI/USB-C pass-through raceways, and concealed under-table cable management.",
    },
    {
      question: "What table sizes and seating capacities are available?",
      answer:
        "We manufacture conference tables ranging from compact 4-seater meeting tables (6 ft) up to large modular 24+ seater boardroom tables (20+ ft) with seamless surface joins.",
    },
    {
      question: "What tabletop finishes and edge bandings are used?",
      answer:
        "Surfaces are crafted with commercial-grade pre-laminated particle board or MDF with 2mm impact-resistant PVC edge banding and scratch-resistant melamine resin coating.",
    },
  ],
  storage: [
    {
      question: "What types of commercial office storage systems does One&Only produce?",
      answer:
        "Our portfolio includes mobile pedestals with anti-tilt castors, metal storage credenzas, sliding-door tambour units, full-height filing cabinets, and modular lockers.",
    },
    {
      question: "Do One&Only storage units feature central locking mechanisms?",
      answer:
        "Yes. All drawer pedestals and filing cabinets are equipped with heavy-duty central locking systems, master keys, and optional digital keypad locks.",
    },
    {
      question: "What steel gauge is used in One&Only metal storage units?",
      answer:
        "We utilize 0.8mm to 1.2mm cold-rolled close annealed (CRCA) prime steel with electrostatic anti-corrosive powder coating for superior longevity.",
    },
  ],
  solutions: [
    {
      question: "Does One&Only offer complete 2D/3D workspace planning services?",
      answer:
        "Yes. Our in-house design team provides turnkey 2D layout planning, 3D space rendering, and interactive floor plans tailored to headcount, department workflows, and acoustic requirements.",
    },
    {
      question: "Can One&Only furnish large-scale enterprise offices across India?",
      answer:
        "Yes, we deliver and install turnkey commercial furniture for offices ranging from 50 to 5,000+ workstations nationwide, supported by dedicated project managers.",
    },
  ],
};

export function getCategoryFaqs(categoryId: string): CategoryFaqItem[] {
  return CATEGORY_FAQS[categoryId.toLowerCase()] || [];
}
