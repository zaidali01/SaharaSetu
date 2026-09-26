import type { ExtractedSnapshot } from '../utils/extractionDiff';

export interface TranscriptData {
  callId: string;
  duration: string;
  timestamp: string;
  audioSimulatedTime: number; // in seconds
  originalLang: string;
  originalText: string;
  translatedText: string;
  confidence: number;
  sentiment: 'Normal' | 'Positive' | 'Distress' | 'Uncertain';
  caller: string;
  receiver: string;
  sarvamModel: string;
  intentBadge?: string;
  keywordsDetected: string[];
}

export interface WhatsAppDraft {
  recipientName: string;
  recipientPhone: string;
  shopName: string;
  messageHindi: string;
  messageEnglish: string;
  items: { name: string; qty: string; estimatedPrice: number }[];
  deliveryAddress: string;
}

export interface BookingDetails {
  serviceName: string;
  provider: string;
  consumerNumber: string;
  dueDate: string;
  amount: number;
  subsidyStatus: string;
  deliveryAddress: string;
}

export interface BlockerDetails {
  reason: string;
  attempts: number;
  lastAttemptTime: string;
  suggestedActions: string[];
  failureCode: 'OUT_OF_STOCK' | 'NO_ANSWER' | 'PAYMENT_AUTH_REQUIRED' | 'ADDRESS_UNVERIFIED';
}

export interface KanbanTask {
  id: string;
  title: string;
  subtitle?: string;
  column: 'done' | 'needs_approval' | 'blocked';
  category: 'medication' | 'utility' | 'chemist' | 'checkin' | 'grocery';
  time: string;
  date: string;
  amount?: number;
  vendor?: string;
  verificationMethod?: string;
  badgeText?: string;
  transcript?: TranscriptData;
  whatsappDraft?: WhatsAppDraft;
  bookingDetails?: BookingDetails;
  blockerDetails?: BlockerDetails;
  guardrailStatus: {
    dosageVerified: boolean;
    financialChecked: boolean;
    emergencyScreened: boolean;
  };
}

export interface ExtractedItem {
  id: string;
  name: string;
  dosage?: string;
  category: string;
  frequency: string;
  frequencyCode?: 'OD' | 'BD' | 'TDS' | 'HS' | 'SOS' | string;
  instruction?: string;
  triggerSlot: string;
  confidenceScore: number;
  rawOcrText?: string;
  sourceBox?: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  status?: 'verified' | 'needs_review' | 'active';
  refillDays?: number;
}

export interface DocumentRecord {
  id: string;
  parentId: string;
  fileName: string;
  docType: 'PRESCRIPTION' | 'ELECTRICITY_BILL' | 'PENSION_CERTIFICATE';
  issuer: {
    title: string;       // e.g. "Dr. S. K. Verma, M.D." or "SBPDCL Billing Desk"
    subtitle: string;    // e.g. "Consultant Physician & Cardiologist"
    address: string;     // e.g. "Exhibition Road Chauraha, Patna"
    regOrConsumer: string;
  };
  patientOrConsumerName: string;
  consultDate: string;
  vitalsOrSummary: string; // e.g. "BP: 128/82, Fasting: 114 mg/dL"
  extractedItems: ExtractedItem[];
  previewImageUrl?: string;
  status?: 'pending_review' | 'processed' | string;
}

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: 'Once Daily (Morning)' | 'Twice Daily (Morning & Night)' | 'At Bedtime (Night)' | 'As Needed' | string;
  frequencyCode: 'OD' | 'BD' | 'TDS' | 'HS' | 'SOS' | string;
  instruction: string;
  nextTriggerTime: string;
  confidence: number;
  sourceBox: {
    top: number;
    left: number;
    width: number;
    height: number;
  };
  status: 'verified' | 'needs_review' | 'active';
  category: 'Cardio' | 'Diabetes' | 'Lipid' | 'Supplement' | 'Thyroid' | 'Pension' | string;
  rawOcrText: string;
  /**
   * Immutable snapshot of the values the OCR engine produced, captured at intake.
   * Task 2.5 — powers the "extracted vs. child-corrected" diff. Never mutate this.
   */
  extracted?: ExtractedSnapshot;
}

export interface AgentNode {
  id: string;
  name: string;
  shortName: string;
  provider: string;
  type: 'voice_telephony' | 'state_engine' | 'execution_layer';
  status: 'active' | 'idle' | 'processing';
  activeDescription: string;
  latencyMs: number;
  model: string;
  systemPromptSummary: string;
  lastPayload: Record<string, any>;
}

export interface EventLogItem {
  id: string;
  timestamp: string;
  agentSource: 'Sarvam Caller Agent' | 'Postgres State Planner' | 'WhatsApp/UPI Action Agent' | 'Guardrail Engine' | 'Track B Vision OCR Pipeline';
  eventType: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  details: string;
  payload: Record<string, any>;
}

export interface CriticalFlag {
  id: string;
  type: 'missed_call' | 'distress_keyword' | 'stock_out' | 'abnormal_vitals' | 'guardrail_payment_blocked' | 'guardrail_dosage_refused';
  severity: 'high' | 'critical' | 'medium';
  title: string;
  description: string;
  timestamp: string;
  actionLabel: string;
  audioSnippet?: string;
  resolved: boolean;
}

export interface ParentProfile {
  id: string;
  name: string;
  relation: string;
  relationship?: string; // backwards compatibility alias
  age: number;
  location: string;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  language: string;
  preferredLanguage: string;
  secondaryLanguage: string;
  dialects: string[];
  vendors: {
    chemist: { name: string; phone: string; area: string; contactPerson?: string };
    lpg: { provider: string; agency: string; consumerNo: string };
    electricity: { provider: string; consumerId: string };
  };
  vitals: {
    bloodPressure: string;
    bloodSugarFasting: string;
    pulseRate: string;
    lastChecked: string;
  };
  emergencyContacts: {
    name: string;
    relation: string;
    phone: string;
    location: string;
  }[];
  preferredPharmacy: {
    name: string;
    phone: string;
    address: string;
    contactPerson: string;
  };
}

// ----------------------------------------------------
// INITIAL SEED DATA
// ----------------------------------------------------

export const INITIAL_PARENTS: ParentProfile[] = [
  {
    id: 'parent-1',
    name: 'Ramprasad Atri',
    relation: 'Father',
    relationship: 'Father',
    age: 74,
    location: 'Kankarbagh, Patna',
    address: 'House #42, Road No. 4, Kankarbagh',
    city: 'Patna, Bihar',
    pincode: '800020',
    phone: '+91 94310 88219',
    language: 'Hindi / Bhojpuri',
    preferredLanguage: 'Hindi / Bhojpuri',
    secondaryLanguage: 'Bhojpuri (Magahi dialect)',
    dialects: ['Bhojpuri', 'Hindi'],
    vendors: {
      chemist: { 
        name: 'Sharma Medical Store', 
        phone: '+91 94302 55441', 
        area: 'Kankarbagh Main Road',
        contactPerson: 'Mukesh Sharma (Proprietor)'
      },
      lpg: { 
        provider: 'Indian Oil Corporation (Indane)', 
        agency: 'Patliputra Indane Gas Agency', 
        consumerNo: 'IND-8831920' 
      },
      electricity: { 
        provider: 'SBPDCL Patna Urban', 
        consumerId: 'CA-1004892188' 
      }
    },
    vitals: {
      bloodPressure: '128/82 mmHg',
      bloodSugarFasting: '114 mg/dL',
      pulseRate: '72 bpm',
      lastChecked: 'Today, 8:30 AM'
    },
    emergencyContacts: [
      { name: 'Yuvraj Atri', relation: 'Son (You)', phone: '+91 98765 43210', location: 'Bengaluru (Metro)' },
      { name: 'Dr. S.K. Verma', relation: 'Family Physician', phone: '+91 94311 22334', location: 'Patna' },
      { name: 'Manoj Kumar (Neighbor)', relation: 'Next-Door Neighbor', phone: '+91 98350 11223', location: 'Kankarbagh, Patna' }
    ],
    preferredPharmacy: {
      name: 'Sharma Medical Store',
      phone: '+91 94302 55441',
      address: 'Near Tempo Stand, Kankarbagh Main Rd, Patna',
      contactPerson: 'Mukesh Sharma (Proprietor)'
    }
  },
  {
    id: 'parent-2',
    name: 'Shanti Devi',
    relation: 'Mother',
    relationship: 'Mother',
    age: 71,
    location: 'Boring Road, Patna',
    address: 'Flat 302, Gangotri Enclave, Boring Road',
    city: 'Patna, Bihar',
    pincode: '800001',
    phone: '+91 94312 99450',
    language: 'Hindi / Maithili',
    preferredLanguage: 'Hindi / Maithili',
    secondaryLanguage: 'Hindi',
    dialects: ['Maithili', 'Hindi'],
    vendors: {
      chemist: { 
        name: 'Patliputra Pharma', 
        phone: '+91 98351 44332', 
        area: 'Boring Road Chauraha',
        contactPerson: 'Sanjay Gupta'
      },
      lpg: { 
        provider: 'HP Gas Corporation', 
        agency: 'Gangotri HP Gas Agency', 
        consumerNo: 'HP-4491028' 
      },
      electricity: { 
        provider: 'SBPDCL Patna Central', 
        consumerId: 'CA-9021884012' 
      }
    },
    vitals: {
      bloodPressure: '122/78 mmHg',
      bloodSugarFasting: '108 mg/dL',
      pulseRate: '76 bpm',
      lastChecked: 'Yesterday, 6:00 PM'
    },
    emergencyContacts: [
      { name: 'Yuvraj Atri', relation: 'Son (You)', phone: '+91 98765 43210', location: 'Bengaluru (Metro)' },
      { name: 'Pooja Kumari', relation: 'Daughter', phone: '+91 99340 77112', location: 'Delhi NCR' }
    ],
    preferredPharmacy: {
      name: 'Patliputra Pharma',
      phone: '+91 98351 44332',
      address: 'Boring Road Chauraha, Patna',
      contactPerson: 'Sanjay Gupta'
    }
  },
  {
    id: 'parent-3',
    name: 'Prof. B. K. Jha',
    relation: 'Uncle',
    relationship: 'Uncle (Senior Citizen)',
    age: 78,
    location: 'Rajendra Nagar, Patna',
    address: 'Quarter 14-B, Road No. 8, Rajendra Nagar',
    city: 'Patna, Bihar',
    pincode: '800016',
    phone: '+91 94315 67120',
    language: 'Bhojpuri / Magahi',
    preferredLanguage: 'Bhojpuri / Magahi',
    secondaryLanguage: 'Hindi',
    dialects: ['Bhojpuri', 'Magahi', 'Hindi'],
    vendors: {
      chemist: { 
        name: 'Apollo Pharmacy — Rajendra Nagar', 
        phone: '+91 94318 33211', 
        area: 'Rajendra Nagar Stadium Road',
        contactPerson: 'Amitabh Mishra'
      },
      lpg: { 
        provider: 'Bharat Gas', 
        agency: 'Mithila Bharat Gas Agency', 
        consumerNo: 'BPCL-992144' 
      },
      electricity: { 
        provider: 'NBPDCL Patna Division', 
        consumerId: 'CA-55120938' 
      }
    },
    vitals: {
      bloodPressure: '134/86 mmHg',
      bloodSugarFasting: '124 mg/dL',
      pulseRate: '68 bpm',
      lastChecked: 'Today, 7:45 AM'
    },
    emergencyContacts: [
      { name: 'Yuvraj Atri', relation: 'Nephew (You)', phone: '+91 98765 43210', location: 'Bengaluru (Metro)' },
      { name: 'Dr. R. N. Jha', relation: 'Brother / Physician', phone: '+91 94310 11990', location: 'Patna' }
    ],
    preferredPharmacy: {
      name: 'Apollo Pharmacy — Rajendra Nagar',
      phone: '+91 94318 33211',
      address: 'Stadium Road, Rajendra Nagar, Patna',
      contactPerson: 'Amitabh Mishra'
    }
  }
];

export const INITIAL_DOCUMENTS: DocumentRecord[] = [
  {
    id: 'doc-1',
    parentId: 'parent-1',
    fileName: 'dr_verma_prescription_pmch.pdf',
    docType: 'PRESCRIPTION',
    issuer: {
      title: 'Dr. S. K. Verma, M.D.',
      subtitle: 'Consultant Physician & Cardiologist • Senior Ex-Consultant PMCH Patna',
      address: 'Exhibition Road Chauraha, Patna - 800001',
      regOrConsumer: 'BCMR / 2004 / 4891'
    },
    patientOrConsumerName: 'Ramprasad Atri',
    consultDate: '24-Sep-2026',
    vitalsOrSummary: 'BP: 148/92 • Refill due in 4 days',
    extractedItems: [
      {
        id: 'rx-1',
        name: 'Tab Telmisartan',
        dosage: '40 mg',
        category: 'Cardio',
        frequency: 'Once Daily (Morning)',
        frequencyCode: 'OD',
        instruction: '1 tablet every morning after breakfast for blood pressure control',
        triggerSlot: '08:00 AM Tomorrow',
        confidenceScore: 0.98,
        refillDays: 4,
        rawOcrText: 'Tab. Telmisartan 40mg OD (1-0-0) (Morn PC)',
        sourceBox: { top: 36, left: 12, width: 76, height: 7 },
        status: 'verified'
      },
      {
        id: 'rx-2',
        name: 'Tab Amlodipine',
        dosage: '5 mg',
        category: 'Cardio',
        frequency: 'Once Daily (Evening)',
        frequencyCode: 'OD',
        instruction: '1 tablet every evening after dinner for blood pressure control',
        triggerSlot: '08:00 PM Tonight',
        confidenceScore: 0.98,
        refillDays: 4,
        rawOcrText: 'Tab. Amlodipine 5mg OD (0-0-1) (Night PC)',
        sourceBox: { top: 45, left: 12, width: 76, height: 7 },
        status: 'verified'
      }
    ]
  },
  {
    id: 'doc-2',
    parentId: 'parent-1',
    fileName: 'dr_anita_roy_ortho_prescription.pdf',
    docType: 'PRESCRIPTION',
    issuer: {
      title: 'Dr. Anita Roy, M.S. (Ortho)',
      subtitle: 'Consultant Orthopedic Surgeon & Joint Care Specialist',
      address: 'Kankarbagh Main Road, Near Tempo Stand, Patna - 800020',
      regOrConsumer: 'BCMR / 2009 / 6124'
    },
    patientOrConsumerName: 'Ramprasad Atri',
    consultDate: '25-Sep-2026',
    vitalsOrSummary: 'Knee Joint OA Grade II • Uric Acid: 5.2 mg/dL',
    extractedItems: [
      {
        id: 'rx-201',
        name: 'Tab Glucosamine + Chondroitin',
        dosage: '1500 mg + 1200 mg',
        category: 'Orthopedic',
        frequency: 'Once Daily (Morning)',
        frequencyCode: 'OD',
        instruction: '1 tablet once daily after breakfast for cartilage restoration',
        triggerSlot: '08:00 AM Tomorrow',
        confidenceScore: 0.98,
        rawOcrText: 'Tab. Glucosamine + Chondroitin OD (Post Meals)',
        sourceBox: { top: 36, left: 12, width: 76, height: 7 },
        status: 'verified'
      },
      {
        id: 'rx-202',
        name: 'Tab Etoricoxib',
        dosage: '90 mg',
        category: 'Orthopedic',
        frequency: 'As Needed (SOS)',
        frequencyCode: 'SOS',
        instruction: '1 tablet only when experiencing acute knee joint inflammation',
        triggerSlot: 'As Needed',
        confidenceScore: 0.96,
        rawOcrText: 'Tab. Etoricoxib 90mg SOS (Severe Pain)',
        sourceBox: { top: 45, left: 12, width: 76, height: 7 },
        status: 'verified'
      },
      {
        id: 'rx-203',
        name: 'Sachet Calcirol (Cholecalciferol D3)',
        dosage: '60,000 IU',
        category: 'Supplement',
        frequency: 'Once Daily (Morning)',
        frequencyCode: 'OD',
        instruction: '1 sachet in warm milk every Sunday morning for bone density',
        triggerSlot: '09:00 AM Sunday',
        confidenceScore: 0.94,
        rawOcrText: 'Sachet Calcirol 60k (Once Weekly)',
        sourceBox: { top: 54, left: 12, width: 76, height: 7 },
        status: 'verified'
      },
      {
        id: 'rx-204',
        name: 'Gel Volini / Diclofenac Sodium',
        dosage: '30 g Gel',
        category: 'Supplement',
        frequency: 'Twice Daily (Morning & Night)',
        frequencyCode: 'BD',
        instruction: 'Gently massage over painful knee area twice daily',
        triggerSlot: '08:30 AM & 08:30 PM',
        confidenceScore: 0.92,
        rawOcrText: 'Gel Volini BD (Local Application)',
        sourceBox: { top: 63, left: 12, width: 76, height: 7 },
        status: 'verified'
      }
    ]
  },
  {
    id: 'doc-3',
    parentId: 'parent-1',
    fileName: 'sbpdcl_urban_bill_sept2026.pdf',
    docType: 'ELECTRICITY_BILL',
    issuer: {
      title: 'SBPDCL Patna Urban Desk',
      subtitle: 'South Bihar Power Distribution Company Ltd',
      address: 'Vidyut Bhawan, Bailey Road, Patna - 800021',
      regOrConsumer: 'CA-1004892188'
    },
    patientOrConsumerName: 'Ramprasad Atri',
    consultDate: '15-Sep-2026',
    vitalsOrSummary: 'Sanctioned Load: 2kW • Units Consumed: 184 kWh • Due: ₹1,420',
    extractedItems: [
      {
        id: 'bill-1',
        name: 'Energy Charges (184 Units)',
        dosage: 'Tier-1 Slab',
        category: 'Utility',
        frequency: 'Once Daily (Morning)',
        frequencyCode: 'OD',
        instruction: 'State government 125 unit power subsidy applied',
        triggerSlot: '18th of Every Month',
        confidenceScore: 0.99,
        rawOcrText: 'Energy Charge @ Rs 6.10/unit: ₹1,120.00',
        sourceBox: { top: 38, left: 12, width: 76, height: 7 },
        status: 'verified'
      },
      {
        id: 'bill-2',
        name: 'Fixed Monthly Meter Demand Charge',
        dosage: 'Domestic LT',
        category: 'Utility',
        frequency: 'Once Daily (Morning)',
        frequencyCode: 'OD',
        instruction: 'Standard 2kW domestic residential meter charge',
        triggerSlot: '18th of Every Month',
        confidenceScore: 0.99,
        rawOcrText: 'Fixed Charge (2kW): ₹150.00',
        sourceBox: { top: 48, left: 12, width: 76, height: 7 },
        status: 'verified'
      },
      {
        id: 'bill-3',
        name: 'Electricity Duty & State Cess',
        dosage: 'Govt Tax',
        category: 'Utility',
        frequency: 'Once Daily (Morning)',
        frequencyCode: 'OD',
        instruction: 'Bihar state power development cess',
        triggerSlot: '18th of Every Month',
        confidenceScore: 0.98,
        rawOcrText: 'Electricity Duty & Cess: ₹150.00',
        sourceBox: { top: 58, left: 12, width: 76, height: 7 },
        status: 'verified'
      }
    ]
  }
];

export const getTasksForParent = (parent: ParentProfile): KanbanTask[] => {
  const chemistName = parent.vendors.chemist.name;
  const chemistPhone = parent.vendors.chemist.phone;
  const chemistArea = parent.vendors.chemist.area;
  const chemistPerson = parent.vendors.chemist.contactPerson || chemistName;
  const lpgProvider = parent.vendors.lpg.provider;
  const lpgAgency = parent.vendors.lpg.agency;
  const lpgConsumer = parent.vendors.lpg.consumerNo;
  const elecProvider = parent.vendors.electricity.provider;
  const elecConsumer = parent.vendors.electricity.consumerId;
  const parentName = parent.name;
  const parentPhone = parent.phone;
  const parentAddress = `${parent.address}, ${parent.city}`;
  const isMother = parent.relation.toLowerCase().includes('mother');

  return [
    {
      id: `task-1-${parent.id}`,
      title: isMother ? 'Morning Thyroid Medicine (Thyronorm 50mcg)' : 'Morning BP Medicine (Amlodipine 5mg)',
      subtitle: isMother ? '1 tablet early morning empty stomach' : '1 tablet after breakfast (Routine Daily)',
      column: 'done',
      category: 'medication',
      time: '8:15 AM',
      date: 'Today',
      verificationMethod: `Verified via ${parent.preferredLanguage.split('/')[0].trim()} voice call (0:34)`,
      badgeText: 'Dose Confirmed · 8:15 AM',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      transcript: {
        callId: `SARVAM-EXOTEL-CALL-${parent.id}-0815`,
        duration: '0:34',
        timestamp: 'Today at 8:15 AM',
        audioSimulatedTime: 34,
        originalLang: parent.preferredLanguage,
        originalText: isMother ? 'हाँ बाबू, खाली पेटे थायरॉइड के गोली खा लेले बानी।' : 'हाँ बाबू, दवाई खा लीहली।',
        translatedText: isMother ? 'Yes son, I have taken the thyroid tablet on an empty stomach.' : 'Yes son, I took the medicine.',
        confidence: 0.98,
        sentiment: 'Normal',
        caller: 'Sahay AI Voice Agent (Sarvam AI)',
        receiver: `${parentName} (${parentPhone})`,
        sarvamModel: 'Sarvam Saarathi-v2 (Indic STT)',
        intentBadge: 'Dose Confirmed · 8:15 AM',
        keywordsDetected: ['नाश्ता (Breakfast)', 'दवाई खा लीहली (Took medicine)', 'तबियत ठीक बा (Feeling good)']
      }
    },
    {
      id: `task-2-${parent.id}`,
      title: `Electricity Bill (${elecProvider.split(' ')[0]})`,
      subtitle: `${elecProvider} • Consumer #${elecConsumer}`,
      column: 'done',
      category: 'utility',
      time: '11:00 AM',
      date: '15th of month',
      amount: 1420,
      verificationMethod: 'Auto-paid ₹1,420 via mandate on 15th',
      badgeText: 'UPI Autopay',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      bookingDetails: {
        serviceName: `${elecProvider} Residential`,
        provider: elecProvider,
        consumerNumber: elecConsumer,
        dueDate: '18th Every Month',
        amount: 1420,
        subsidyStatus: 'Govt 125 units slab applied',
        deliveryAddress: parentAddress
      }
    },
    {
      id: `task-gas-completed-${parent.id}`,
      title: `${lpgProvider.split(' ')[0]} Gas Refill Delivery`,
      subtitle: `Delivered via ${lpgAgency} — Digital Receipt Confirmed`,
      column: 'done',
      category: 'utility',
      time: '11:30 AM',
      date: 'Today',
      amount: 912,
      verificationMethod: 'Delivered & Confirmed at Doorstep',
      badgeText: 'Delivered · 11:30 AM',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      bookingDetails: {
        serviceName: `${lpgProvider} 14.2kg Domestic LPG Refill`,
        provider: lpgProvider,
        consumerNumber: lpgConsumer,
        dueDate: 'Completed Today',
        amount: 912,
        subsidyStatus: 'DBTL Direct Transfer Complete',
        deliveryAddress: parentAddress
      }
    },
    {
      id: `task-3-${parent.id}`,
      title: `Chemist Refill Dispatch — ${chemistName}`,
      subtitle: isMother 
        ? 'Thyronorm 50mcg (1 bottle 120s) + Telmisartan 40mg (1 strip)'
        : 'Metformin 500mg (2 strips) + Amlodipine 5mg (1 strip)',
      column: 'needs_approval',
      category: 'chemist',
      time: 'Due Today',
      date: 'Prescription Refill',
      amount: 340.00,
      vendor: `${chemistName}, ${chemistArea}`,
      badgeText: 'Manual Sign-off Required',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      whatsappDraft: {
        recipientName: `${chemistPerson} (${chemistName})`,
        recipientPhone: chemistPhone,
        shopName: `${chemistName}, ${chemistArea}`,
        deliveryAddress: parentAddress,
        items: isMother ? [
          { name: 'Tab Thyronorm 50mcg (120 tabs)', qty: '1 bottle', estimatedPrice: 190.00 },
          { name: 'Tab Telmisartan 40mg (Telma 40)', qty: '1 strip (15 tabs)', estimatedPrice: 150.00 }
        ] : [
          { name: 'Tab Metformin 500mg (Glycomet 500)', qty: '2 strips (20 tabs)', estimatedPrice: 190.00 },
          { name: 'Tab Amlodipine 5mg (Amlong 5)', qty: '1 strip (15 tabs)', estimatedPrice: 150.00 }
        ],
        messageHindi: `नमस्ते ${chemistPerson.split(' ')[0]} जी! सहाय AI (${parentName} जी के सुपुत्र युवराज द्वारा अधिकृत)।\nकृपया नीचे दी गई दवाइयां आज शाम 5 बजे तक घर पहुँचा दीजिए:\n\n1. ${isMother ? 'Tab Thyronorm 50mcg' : 'Tab Metformin 500mg'} - 2 स्ट्रिप\n2. ${isMother ? 'Tab Telmisartan 40mg' : 'Tab Amlodipine 5mg'} - 1 स्ट्रिप\n\nपता: ${parentAddress}।\nभुगतान: डिलीवरी पर ऑनलाइन UPI (₹340) तुरंत ट्रांसफर कर दिया जाएगा। धन्यवाद!`,
        messageEnglish: `Hello ${chemistPerson.split(' ')[0]} ji! Sahay AI (Authorized on behalf of ${parentName}'s family).\nPlease deliver the following medicines by 5 PM today:\n1. ${isMother ? 'Tab Thyronorm 50mcg' : 'Tab Metformin 500mg'} - 2 strips\n2. ${isMother ? 'Tab Telmisartan 40mg' : 'Tab Amlodipine 5mg'} - 1 strip\nAddress: ${parentAddress}.\nPayment: UPI ₹340 will be transferred upon delivery receipt. Thank you!`
      }
    },
    {
      id: `task-4-${parent.id}`,
      title: `${lpgProvider.split(' ')[0]} Cylinder Booking`,
      subtitle: `Consumer # ${lpgConsumer} (Next cycle scheduled)`,
      column: 'needs_approval',
      category: 'utility',
      time: 'Due in 4 days',
      date: 'LPG Refill',
      amount: 912.00,
      vendor: lpgAgency,
      badgeText: 'Payment Authorization',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      bookingDetails: {
        serviceName: `${lpgProvider} 14.2kg Domestic LPG Refill`,
        provider: lpgProvider,
        consumerNumber: lpgConsumer,
        dueDate: 'In 4 days',
        amount: 912.00,
        subsidyStatus: 'Direct Benefit Transfer (DBTL) Active',
        deliveryAddress: parentAddress
      }
    },
    {
      id: `task-5-${parent.id}`,
      title: 'Vitamin D3 Refill Failed',
      subtitle: 'Shellcal 500 + D3 Chewable (Monthly Pack)',
      column: 'blocked',
      category: 'chemist',
      time: '12:45 PM',
      date: 'Stock Issue',
      amount: 210.00,
      vendor: chemistName,
      badgeText: 'Stock Blocker',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      blockerDetails: {
        failureCode: 'OUT_OF_STOCK',
        reason: `${chemistName} reported Shellcal-D3 60k chewables temporarily out of stock (Next delivery expected in 3 days).`,
        attempts: 1,
        lastAttemptTime: 'Today at 12:45 PM',
        suggestedActions: [
          'Route to Apollo Pharmacy (Kankarbagh Colony Road)',
          'Route to Patliputra Pharma (Boring Road, 45 min delivery)',
          'Order via Tata 1mg Express (24 hr courier)'
        ]
      }
    },
    {
      id: `task-6-${parent.id}`,
      title: 'Evening Check-in Call (2 Attempts Unanswered)',
      subtitle: 'Scheduled routine health check & dinner reminder',
      column: 'blocked',
      category: 'checkin',
      time: '10:30 AM',
      date: 'Unanswered Alert',
      badgeText: 'Call Unanswered',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      blockerDetails: {
        failureCode: 'NO_ANSWER',
        reason: `Voice AI dialed ${parentName} at 10:00 AM and 10:30 AM. Call rang out for 45s without answer.`,
        attempts: 2,
        lastAttemptTime: 'Today at 10:30 AM',
        suggestedActions: [
          'Trigger Immediate Child Emergency Call',
          `Ping Neighbor Manoj Kumar (+91 98350 11223) via WhatsApp`,
          'Trigger Loud Priority Siren Ring via Exotel Outbound'
        ]
      }
    }
  ];
};

export const INITIAL_TASKS: KanbanTask[] = getTasksForParent(INITIAL_PARENTS[0]);

export const PRESCRIPTION_OCR_ITEMS: PrescriptionItem[] = INITIAL_DOCUMENTS[0].extractedItems.map(item => ({
  id: item.id,
  medicineName: item.name,
  dosage: item.dosage || '5 mg',
  frequency: item.frequency as any,
  frequencyCode: (item.frequencyCode || 'OD') as any,
  instruction: item.instruction || 'Take once daily as directed by doctor',
  nextTriggerTime: item.triggerSlot,
  confidence: item.confidenceScore,
  sourceBox: item.sourceBox || { top: 36, left: 12, width: 76, height: 7 },
  status: item.status || 'verified',
  category: (item.category || 'Cardio') as any,
  rawOcrText: item.rawOcrText || `${item.name} ${item.dosage || ''} ${item.frequencyCode || ''}`
}));

export const getAgentNodesForParent = (parent: ParentProfile): AgentNode[] => [
  {
    id: 'agent-caller',
    name: 'Caller Voice Agent',
    shortName: 'Sarvam Indic ASR + Exotel',
    provider: 'Sarvam Saarathi v2 + Exotel SIP',
    type: 'voice_telephony',
    status: 'active',
    activeDescription: `Transcribing live ${parent.preferredLanguage} dual-stream audio. VAD & latency optimized for 2G/VoLTE calls in ${parent.city}.`,
    latencyMs: 340,
    model: `Sarvam-Saarathi-Audio-2.0 (${parent.dialects.join('/')} Acoustic)`,
    systemPromptSummary: `Compassionate Bihari eldercare caller assistant. Speaks natural conversational Hindi with local colloquial respect markers (बाबू, प्रणाम). Monitored patient: ${parent.name}. Strict instruction never to provide unauthorized medical advice.`,
    lastPayload: {
      callSessionId: `EXO-PATNA-${parent.id.toUpperCase()}`,
      targetNumber: parent.phone,
      targetPatient: parent.name,
      codec: 'G.711u / AMR-WB',
      asrEngine: 'Sarvam-Speech-to-Text-Indic',
      detectedLanguage: `${parent.preferredLanguage} (Confidence 98.4%)`,
      lastSpokenUtterance: parent.relation.toLowerCase().includes('mother') ? 'हाँ बाबू, खाली पेटे थायरॉइड के गोली खा लेले बानी।' : 'हाँ बाबू, दवाई खा लीहली।',
      vadDurationSeconds: 34.2
    }
  },
  {
    id: 'agent-planner',
    name: 'Planner & Guardrail Engine',
    shortName: 'Postgres State Machine',
    provider: 'Deterministic State Machine + LangGraph',
    type: 'state_engine',
    status: 'active',
    activeDescription: 'Evaluating clinical guardrail policies, checking prescription schema constraints, and managing execution queue.',
    latencyMs: 82,
    model: 'State-Machine v4.2 + Safety Classifier',
    systemPromptSummary: `Deterministic state transitions for parent care workflows (${parent.name}). Enforces hard safety invariants: Zero financial transaction without explicit child token, zero automated dosage variation.`,
    lastPayload: {
      currentState: 'INTAKE_CONFIRMED_AWAITING_DISPATCH',
      verifiedTask: `MEDICATION_CONFIRMED_${parent.name.split(' ')[0].toUpperCase()}`,
      financialGate: 'PASS (₹0.00 voice checkin)',
      distressKeywordScore: '0.01 (No emergency detected)',
      nextScheduledTransition: 'EVENING_CHECKIN_20_00_IST'
    }
  },
  {
    id: 'agent-action',
    name: 'Action & Gateway Agent',
    shortName: 'WhatsApp Cloud & UPI',
    provider: 'Meta WhatsApp Business API + Setu UPI Gateway',
    type: 'execution_layer',
    status: 'active',
    activeDescription: `Formatting local language WhatsApp orders for designated chemist (${parent.vendors.chemist.name}) and queuing authorized UPI payments.`,
    latencyMs: 190,
    model: 'WhatsApp-Bilingual-Template-Gen v2',
    systemPromptSummary: `Executes approved actions in physical world: dispatches Hindi purchase orders to ${parent.vendors.chemist.name}, submits verified consumer IDs (${parent.vendors.electricity.consumerId}) to Bharat BillPay (BBPS).`,
    lastPayload: {
      channel: 'WHATSAPP_BUSINESS_CLOUD_API',
      vendorRecipient: `${parent.vendors.chemist.phone} (${parent.vendors.chemist.name})`,
      messageStatus: 'QUEUED_FOR_CHILD_SIGN_OFF',
      paymentMandateId: `SETU-BBPS-${parent.id.toUpperCase()}-1420`,
      dispatchEstimatedWindow: 'Same-day 17:00 IST'
    }
  }
];

export const AGENT_PIPELINE_NODES: AgentNode[] = getAgentNodesForParent(INITIAL_PARENTS[0]);

export const INITIAL_EVENT_LOGS: EventLogItem[] = [
  {
    id: 'log-1',
    timestamp: '08:15:34 IST',
    agentSource: 'Sarvam Caller Agent',
    eventType: 'VOICE_RECOGNITION_COMPLETE',
    severity: 'success',
    details: 'Parent confirmed taking Morning Amlodipine 5mg during 34s Bhojpuri/Hindi voice call.',
    payload: {
      callId: 'SARVAM-EXOTEL-CALL-88219-0815',
      intent: 'PILL_TAKEN_CONFIRMED',
      asrConfidence: 0.984,
      rawBhojpuri: 'हाँ बाबू, दवाई खा लीहली।'
    }
  },
  {
    id: 'log-2',
    timestamp: '08:15:36 IST',
    agentSource: 'Guardrail Engine',
    eventType: 'SAFETY_POLICY_CHECK_PASSED',
    severity: 'info',
    details: 'Guardrail Rule #1 (Dosage Unchanged) & Rule #3 (Distress Screening) passed 100%.',
    payload: {
      rule1_dosage_check: 'VERIFIED_AGAINST_PRESCRIPTION_RX1',
      rule3_distress_sentiment: 'POSITIVE_CALM',
      riskScore: 0.02
    }
  },
  {
    id: 'log-3',
    timestamp: '08:15:38 IST',
    agentSource: 'Postgres State Planner',
    eventType: 'TASK_STATE_TRANSITION',
    severity: 'info',
    details: 'Moved task "Morning BP Medicine" from PENDING to DONE.',
    payload: {
      taskId: 'task-1',
      previousState: 'PENDING_CONFIRMATION',
      newState: 'DONE',
      updatedBy: 'Sarvam-Webhook-Autocommit'
    }
  },
  {
    id: 'log-4',
    timestamp: '09:00:12 IST',
    agentSource: 'WhatsApp/UPI Action Agent',
    eventType: 'INVENTORY_REORDER_DRAFTED',
    severity: 'warning',
    details: 'Drafted WhatsApp refill order (₹340.00) for Sharma Medical Store. Held in queue for child approval.',
    payload: {
      taskId: 'task-3',
      vendor: 'Sharma Medical Store, Kankarbagh',
      amount: 340.00,
      safetyGateTriggered: 'FINANCIAL_APPROVAL_POLICY_ACTIVE'
    }
  },
  {
    id: 'log-5',
    timestamp: '10:30:05 IST',
    agentSource: 'Sarvam Caller Agent',
    eventType: 'CALL_UNANSWERED_THRESHOLD_EXCEEDED',
    severity: 'critical',
    details: 'Outbound check-in call to Ramprasad Atri (+91 94310 88219) rang out for 45s (2nd attempt).',
    payload: {
      attemptCount: 2,
      escalationState: 'CRITICAL_ALERT_FIRED_TO_CHILD_APP',
      cooldownSeconds: 900
    }
  }
];

export const INITIAL_CRITICAL_FLAGS: CriticalFlag[] = [
  {
    id: 'flag-1',
    type: 'missed_call',
    severity: 'high',
    title: 'Missed 2 calls at 10:00 AM & 10:30 AM',
    description: 'Scheduled morning follow-up call to Ramprasad Atri (+91 94310 88219) was unanswered twice.',
    timestamp: 'Today, 10:30 AM',
    actionLabel: 'Direct Call Parent',
    resolved: false
  },
  {
    id: 'flag-2',
    type: 'distress_keyword',
    severity: 'critical',
    title: 'Distress Flag: Parent said "Chakkar aa raha hai"',
    description: 'Voice recognition caught dizziness keyword ("चक्कर आ रहा है / Dizziness") during the 8:15 AM call.',
    timestamp: 'Today, 8:15 AM',
    actionLabel: 'Listen Audio & Emergency Ping',
    audioSnippet: '...तनी चक्कर जइसन बुझाता, बाकिर अभी बैठल बानी...',
    resolved: false
  }
];

export const GUARDRAIL_POLICIES = [
  {
    id: 'g-1',
    title: 'Clinical Boundary',
    icon: 'Pill',
    status: '100% Policy Pass',
    description: 'Zero dosage adjustments permitted; only recurrence and refill schedules are extracted from grounded prescriptions. Any molecular change triggers a child clinical review gate.',
    policyCode: 'MED-GUARDRAIL-01-IMMUTABLE-DOSE'
  },
  {
    id: 'g-2',
    title: 'Financial Shield',
    icon: 'ShieldCheck',
    status: '100% Policy Pass',
    description: 'Any physical transaction > ₹0 strictly requires manual 1-click child sign-off from this dashboard before funds or WhatsApp purchase orders are dispatched to vendors.',
    policyCode: 'FIN-GUARDRAIL-02-EXPLICIT-CONSENT'
  },
  {
    id: 'g-3',
    title: 'Emergency Interruption',
    icon: 'AlertTriangle',
    status: '100% Policy Pass',
    description: 'Distress keywords ("chakkar", "chest pain", "gir gaye", "सांस फूलना") immediately terminate automated IVR prompts and alert the child and local contacts.',
    policyCode: 'EMERG-GUARDRAIL-03-INSTANT-ABORT'
  }
];
