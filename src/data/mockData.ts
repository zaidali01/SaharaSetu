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

export interface PrescriptionItem {
  id: string;
  medicineName: string;
  dosage: string;
  frequency: 'Once Daily (Morning)' | 'Twice Daily (Morning & Night)' | 'At Bedtime (Night)' | 'As Needed';
  frequencyCode: 'OD' | 'BD' | 'TDS' | 'HS' | 'SOS';
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
  category: 'Cardio' | 'Diabetes' | 'Lipid' | 'Supplement';
  rawOcrText: string;
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
  agentSource: 'Sarvam Caller Agent' | 'Postgres State Planner' | 'WhatsApp/UPI Action Agent' | 'Guardrail Engine';
  eventType: string;
  severity: 'info' | 'success' | 'warning' | 'critical';
  details: string;
  payload: Record<string, any>;
}

export interface CriticalFlag {
  id: string;
  type: 'missed_call' | 'distress_keyword' | 'stock_out' | 'abnormal_vitals';
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
  relationship: string;
  age: number;
  address: string;
  city: string;
  pincode: string;
  phone: string;
  preferredLanguage: string;
  secondaryLanguage: string;
  dialects: string[];
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
    relationship: 'Father',
    age: 74,
    address: 'House #42, Road No. 4, Kankarbagh',
    city: 'Patna, Bihar',
    pincode: '800020',
    phone: '+91 94310 88219',
    preferredLanguage: 'Hindi / Bhojpuri',
    secondaryLanguage: 'Bhojpuri (Magahi dialect)',
    dialects: ['Bhojpuri', 'Hindi'],
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
    relationship: 'Mother',
    age: 71,
    address: 'Flat 302, Gangotri Enclave, Boring Road',
    city: 'Patna, Bihar',
    pincode: '800001',
    phone: '+91 94312 99450',
    preferredLanguage: 'Hindi / Maithili',
    secondaryLanguage: 'Hindi',
    dialects: ['Maithili', 'Hindi'],
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
  }
];

export const INITIAL_TASKS: KanbanTask[] = [
  {
    id: 'task-1',
    title: 'Morning BP Medicine (Amlodipine 5mg)',
    subtitle: '1 tablet after breakfast (Routine Daily)',
    column: 'done',
    category: 'medication',
    time: '8:15 AM',
    date: 'Today',
    verificationMethod: 'Verified via Hindi voice call (0:34)',
    badgeText: 'Dose Confirmed · 8:15 AM',
    guardrailStatus: {
      dosageVerified: true,
      financialChecked: true,
      emergencyScreened: true
    },
    transcript: {
      callId: 'SARVAM-EXOTEL-CALL-88219-0815',
      duration: '0:34',
      timestamp: 'Today at 8:15 AM',
      audioSimulatedTime: 34,
      originalLang: 'Bhojpuri / Hindi',
      originalText: 'हाँ बाबू, दवाई खा लीहली।',
      translatedText: 'Yes son, I took the medicine.',
      confidence: 0.98,
      sentiment: 'Normal',
      caller: 'Sahay AI Voice Agent (Sarvam AI)',
      receiver: 'Ramprasad Atri (+91 94310 88219)',
      sarvamModel: 'Sarvam Saarathi-v2 (Bhojpuri/Hindi STT)',
      intentBadge: 'Dose Confirmed · 8:15 AM',
      keywordsDetected: ['नाश्ता (Breakfast)', 'दवाई खा लीहली (Took medicine)', 'तबियत ठीक बा (Feeling good)']
    }
  },
  {
    id: 'task-2',
    title: 'Electricity Bill (SBPDCL)',
    subtitle: 'South Bihar Power Distribution Corp Ltd',
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
      serviceName: 'SBPDCL Urban Patna Electricity',
      provider: 'South Bihar Power Distribution Company',
      consumerNumber: 'CA-1004892188',
      dueDate: '18th Every Month',
      amount: 1420,
      subsidyStatus: 'Govt 125 units slab applied',
      deliveryAddress: 'House #42, Road No. 4, Kankarbagh, Patna'
    }
  },
  {
    id: 'task-gas-completed',
    title: 'Indane Gas Refill Delivery',
    subtitle: 'Delivered via Kankarbagh Gas Agency — Digital Receipt Confirmed',
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
      serviceName: 'Indane 14.2kg Domestic LPG Refill',
      provider: 'Indian Oil Corporation Ltd (IOCL)',
      consumerNumber: 'IND-8831920',
      dueDate: 'Completed Today',
      amount: 912,
      subsidyStatus: 'DBTL Direct Transfer Complete',
      deliveryAddress: 'House #42, Road No. 4, Kankarbagh, Patna'
    }
  },
  {
    id: 'task-3',
    title: 'Chemist Refill Dispatch — Sharma Medical Store',
    subtitle: 'Metformin 500mg (2 strips) + Amlodipine 5mg (1 strip)',
    column: 'needs_approval',
    category: 'chemist',
    time: 'Due Today',
    date: 'Prescription Refill',
    amount: 340.00,
    vendor: 'Sharma Medical Store, Kankarbagh',
    badgeText: 'Manual Sign-off Required',
    guardrailStatus: {
      dosageVerified: true,
      financialChecked: true,
      emergencyScreened: true
    },
    whatsappDraft: {
      recipientName: 'Mukesh Sharma (Sharma Medical Store)',
      recipientPhone: '+91 94302 55441',
      shopName: 'Sharma Medical Store, Kankarbagh',
      deliveryAddress: 'House #42, Road No. 4, Kankarbagh, Patna (Near Tempo Stand)',
      items: [
        { name: 'Tab Metformin 500mg (Glycomet 500)', qty: '2 strips (20 tabs)', estimatedPrice: 190.00 },
        { name: 'Tab Amlodipine 5mg (Amlong 5)', qty: '1 strip (15 tabs)', estimatedPrice: 150.00 }
      ],
      messageHindi: 'नमस्ते मुकेश जी! सहाय AI (रामप्रसाद अत्री जी के सुपुत्र युवराज द्वारा अधिकृत)।\nकृपया नीचे दी गई दवाइयां आज शाम 5 बजे तक घर पहुँचा दीजिए:\n\n1. Tab Metformin 500mg - 2 स्ट्रिप\n2. Tab Amlodipine 5mg - 1 स्ट्रिप\n\nपता: मकान नं 42, रोड नं 4, कंकड़बाग।\nभुगतान: डिलीवरी पर ऑनलाइन UPI (₹340) तुरंत ट्रांसफर कर दिया जाएगा। धन्यवाद!',
      messageEnglish: 'Hello Mukesh ji! Sahay AI (Authorized on behalf of Ramprasad Atri\'s son Yuvraj).\nPlease deliver the following medicines by 5 PM today:\n1. Tab Metformin 500mg - 2 strips\n2. Tab Amlodipine 5mg - 1 strip\nAddress: House #42, Road #4, Kankarbagh.\nPayment: UPI ₹340 will be transferred upon delivery receipt. Thank you!'
    }
  },
  {
    id: 'task-4',
    title: 'Indane Gas Cylinder Booking',
    subtitle: 'Consumer # IND-8831920 (Next cycle scheduled)',
    column: 'needs_approval',
    category: 'utility',
    time: 'Due in 4 days',
    date: 'LPG Refill',
    amount: 912.00,
    vendor: 'Patliputra Indane Gas Agency',
    badgeText: 'Payment Authorization',
    guardrailStatus: {
      dosageVerified: true,
      financialChecked: true,
      emergencyScreened: true
    },
    bookingDetails: {
      serviceName: 'Indane 14.2kg Domestic LPG Refill',
      provider: 'Indian Oil Corporation Ltd (IOCL)',
      consumerNumber: 'IND-8831920',
      dueDate: 'In 4 days (Est. Empty: Oct 1)',
      amount: 912.00,
      subsidyStatus: 'Direct Benefit Transfer (DBTL) Active',
      deliveryAddress: 'House #42, Road No. 4, Kankarbagh, Patna'
    }
  },
  {
    id: 'task-5',
    title: 'Vitamin D3 Refill Failed',
    subtitle: 'Shellcal 500 + D3 Chewable (Monthly Pack)',
    column: 'blocked',
    category: 'chemist',
    time: '12:45 PM',
    date: 'Stock Issue',
    amount: 210.00,
    vendor: 'Sharma Medical Store',
    badgeText: 'Stock Blocker',
    guardrailStatus: {
      dosageVerified: true,
      financialChecked: true,
      emergencyScreened: true
    },
    blockerDetails: {
      failureCode: 'OUT_OF_STOCK',
      reason: 'Sharma Medical Store reported Shellcal-D3 60k chewables temporarily out of stock (Next delivery expected in 3 days).',
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
    id: 'task-6',
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
      reason: 'Voice AI dialed at 10:00 AM and 10:30 AM. Call rang out for 45s without answer.',
      attempts: 2,
      lastAttemptTime: 'Today at 10:30 AM',
      suggestedActions: [
        'Trigger Immediate Child Emergency Call',
        'Ping Neighbor Manoj Kumar (+91 98350 11223) via WhatsApp',
        'Trigger Loud Priority Siren Ring via Exotel Outbound'
      ]
    }
  }
];

export const PRESCRIPTION_OCR_ITEMS: PrescriptionItem[] = [
  {
    id: 'rx-1',
    medicineName: 'Tab Amlodipine',
    dosage: '5 mg',
    frequency: 'Once Daily (Morning)',
    frequencyCode: 'OD',
    instruction: '1 tablet every morning after breakfast for hypertension control',
    nextTriggerTime: '08:00 AM Tomorrow',
    confidence: 0.98,
    category: 'Cardio',
    rawOcrText: 'Tab. Amlodipine 5mg OD (Morn PC)',
    sourceBox: {
      top: 36,
      left: 12,
      width: 76,
      height: 7
    },
    status: 'verified'
  },
  {
    id: 'rx-2',
    medicineName: 'Tab Metformin HCl',
    dosage: '500 mg',
    frequency: 'Twice Daily (Morning & Night)',
    frequencyCode: 'BD',
    instruction: '1 tablet twice a day immediately after morning and evening meals',
    nextTriggerTime: '08:30 AM & 08:30 PM',
    confidence: 0.96,
    category: 'Diabetes',
    rawOcrText: 'Tab. Metformin 500mg BD (Post Meals)',
    sourceBox: {
      top: 45,
      left: 12,
      width: 76,
      height: 7
    },
    status: 'verified'
  },
  {
    id: 'rx-3',
    medicineName: 'Tab Atorvastatin',
    dosage: '10 mg',
    frequency: 'At Bedtime (Night)',
    frequencyCode: 'HS',
    instruction: '1 tablet once daily at bedtime with warm water for lipid management',
    nextTriggerTime: '10:00 PM Tonight',
    confidence: 0.94,
    category: 'Lipid',
    rawOcrText: 'Tab. Atorvastatin 10mg HS (Bedtime)',
    sourceBox: {
      top: 54,
      left: 12,
      width: 76,
      height: 7
    },
    status: 'verified'
  },
  {
    id: 'rx-4',
    medicineName: 'Tab Shellcal (Calcium + D3)',
    dosage: '500 mg + 250 IU',
    frequency: 'Once Daily (Morning)',
    frequencyCode: 'OD',
    instruction: '1 tablet once daily after lunch for bone density support',
    nextTriggerTime: '01:30 PM Tomorrow',
    confidence: 0.91,
    category: 'Supplement',
    rawOcrText: 'Tab. Shellcal 500 OD (Post Lunch)',
    sourceBox: {
      top: 63,
      left: 12,
      width: 76,
      height: 7
    },
    status: 'needs_review'
  }
];

export const AGENT_PIPELINE_NODES: AgentNode[] = [
  {
    id: 'agent-caller',
    name: 'Caller Voice Agent',
    shortName: 'Sarvam Indic ASR + Exotel',
    provider: 'Sarvam Saarathi v2 + Exotel SIP',
    type: 'voice_telephony',
    status: 'active',
    activeDescription: 'Transcribing live Bhojpuri/Hindi dual-stream audio. VAD & latency optimized for 2G/VoLTE calls in Bihar.',
    latencyMs: 340,
    model: 'Sarvam-Saarathi-Audio-2.0 (Hindi/Bhojpuri Acoustic)',
    systemPromptSummary: 'Compassionate Bihari eldercare caller assistant. Speaks natural conversational Hindi with Bhojpuri colloquial respect markers (बाबू, प्रणाम). Strict instruction never to provide medical advice or modify dosage.',
    lastPayload: {
      callSessionId: 'EXO-991204-PATNA',
      targetNumber: '+91 94310 88219',
      codec: 'G.711u / AMR-WB',
      asrEngine: 'Sarvam-Speech-to-Text-Indic',
      detectedLanguage: 'Bhojpuri-Hindi Hybrid (Confidence 98.4%)',
      lastSpokenUtterance: 'हाँ बाबू, दवाई खा लीहली।',
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
    systemPromptSummary: 'Deterministic state transitions for parent care workflows. Enforces hard safety invariants: Zero financial transaction without explicit child token, zero automated dosage variation, instant trigger on distress keywords.',
    lastPayload: {
      currentState: 'INTAKE_CONFIRMED_AWAITING_DISPATCH',
      verifiedTask: 'MEDICATION_AMLO_5MG',
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
    activeDescription: 'Formatting local language WhatsApp orders for local chemists and queuing authorized UPI payments.',
    latencyMs: 190,
    model: 'WhatsApp-Bilingual-Template-Gen v2',
    systemPromptSummary: 'Executes approved actions in the physical world: dispatches Hindi purchase orders to localized chemists, submits verified bill IDs to Bharat BillPay (BBPS), and delivers summary cards to child via push.',
    lastPayload: {
      channel: 'WHATSAPP_BUSINESS_CLOUD_API',
      vendorRecipient: '+91 94302 55441 (Sharma Medical Store)',
      messageStatus: 'QUEUED_FOR_CHILD_SIGN_OFF',
      paymentMandateId: 'SETU-BBPS-PATNA-1420',
      dispatchEstimatedWindow: 'Same-day 17:00 IST'
    }
  }
];

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
