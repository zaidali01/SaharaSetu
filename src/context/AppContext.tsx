import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audio';
import { apiService } from '../services/api';
import type {
  KanbanTask,
  ParentProfile,
  PrescriptionItem,
  DocumentRecord,
  AgentNode,
  EventLogItem,
  CriticalFlag
} from '../data/mockData';
import {
  INITIAL_PARENTS,
  INITIAL_TASKS,
  INITIAL_DOCUMENTS,
  PRESCRIPTION_OCR_ITEMS,
  AGENT_PIPELINE_NODES,
  INITIAL_EVENT_LOGS,
  INITIAL_CRITICAL_FLAGS,
  getTasksForParent,
  getAgentNodesForParent
} from '../data/mockData';

export type ActiveTab = 'command_board' | 'document_intake' | 'agent_trace';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
}

interface AppContextType {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  parents: ParentProfile[];
  activeParent: ParentProfile;
  setActiveParent: (parent: ParentProfile) => void;
  documents: DocumentRecord[];
  setDocuments: React.Dispatch<React.SetStateAction<DocumentRecord[]>>;
  activeDocument: DocumentRecord;
  setActiveDocument: (doc: DocumentRecord) => void;
  uploadDocument: (file: File | { name: string; docType?: 'PRESCRIPTION' | 'ELECTRICITY_BILL' | 'PENSION_CERTIFICATE' }) => void;
  tasks: KanbanTask[];
  setTasks: React.Dispatch<React.SetStateAction<KanbanTask[]>>;
  prescriptionItems: PrescriptionItem[];
  setPrescriptionItems: React.Dispatch<React.SetStateAction<PrescriptionItem[]>>;
  agentNodes: AgentNode[];
  eventLogs: EventLogItem[];
  addEventLog: (log: Omit<EventLogItem, 'id' | 'timestamp'>) => void;
  criticalFlags: CriticalFlag[];
  resolveCriticalFlag: (id: string) => void;
  addCriticalFlag: (flag: Omit<CriticalFlag, 'id' | 'timestamp'>) => void;
  
  // Modals & Drawers state
  isGuardrailsOpen: boolean;
  setIsGuardrailsOpen: (open: boolean) => void;
  isAlertsDrawerOpen: boolean;
  setIsAlertsDrawerOpen: (open: boolean) => void;
  isParentProfileOpen: boolean;
  setIsParentProfileOpen: (open: boolean) => void;
  activeTranscriptTask: KanbanTask | null;
  setActiveTranscriptTask: (task: KanbanTask | null) => void;
  activeWhatsAppTask: KanbanTask | null;
  setActiveWhatsAppTask: (task: KanbanTask | null) => void;
  activeChemistModalTask: KanbanTask | null;
  setActiveChemistModalTask: (task: KanbanTask | null) => void;
  activeAuditTask: KanbanTask | null;
  setActiveAuditTask: (task: KanbanTask | null) => void;
  distressAlertModalData: CriticalFlag | null;
  setDistressAlertModalData: (data: CriticalFlag | null) => void;
  
  // Highlighting & Actions
  approveTask: (taskId: string) => void;
  rejectTask: (taskId: string) => void;
  resolveStockBlocker: (taskId: string, alternateChemist: string) => void;
  approvePrescriptionSchedule: () => void;
  
  // Demo Simulator Triggers
  triggerSimulateMorningCall: () => void;
  triggerSimulateMissedCall: () => void;
  triggerSimulateDistressAlert: () => void;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Selected Rx Item for synchronized canvas highlight
  selectedRxId: string | null;
  setSelectedRxId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('command_board');
  const [parents] = useState<ParentProfile[]>(INITIAL_PARENTS);
  const [activeParent, setActiveParentState] = useState<ParentProfile>(INITIAL_PARENTS[0]);
  const [documents, setDocuments] = useState<DocumentRecord[]>(INITIAL_DOCUMENTS);
  const [activeDocument, setActiveDocumentState] = useState<DocumentRecord>(INITIAL_DOCUMENTS[0]);
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>(PRESCRIPTION_OCR_ITEMS);
  const [agentNodes, setAgentNodes] = useState<AgentNode[]>(AGENT_PIPELINE_NODES);
  const [eventLogs, setEventLogs] = useState<EventLogItem[]>(INITIAL_EVENT_LOGS);
  const [criticalFlags, setCriticalFlags] = useState<CriticalFlag[]>(INITIAL_CRITICAL_FLAGS);
  
  const [isGuardrailsOpen, setIsGuardrailsOpen] = useState(false);
  const [isAlertsDrawerOpen, setIsAlertsDrawerOpen] = useState(false);
  const [isParentProfileOpen, setIsParentProfileOpen] = useState(false);
  const [activeTranscriptTask, setActiveTranscriptTask] = useState<KanbanTask | null>(null);
  const [activeWhatsAppTask, setActiveWhatsAppTask] = useState<KanbanTask | null>(null);
  const [activeChemistModalTask, setActiveChemistModalTask] = useState<KanbanTask | null>(null);
  const [activeAuditTask, setActiveAuditTask] = useState<KanbanTask | null>(null);
  const [distressAlertModalData, setDistressAlertModalData] = useState<CriticalFlag | null>(null);
  const [selectedRxId, setSelectedRxId] = useState<string | null>('rx-1');

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Initial Backend Hydration (Optimistic & Offline-safe)
  useEffect(() => {
    let isMounted = true;
    const hydrateBackend = async () => {
      // 1. Try fetching active parent
      const remoteParent = await apiService.getActiveParent();
      if (remoteParent && isMounted) {
        setActiveParentState(prev => ({
          ...prev,
          ...remoteParent,
          vendors: { ...prev.vendors, ...remoteParent.vendors }
        }));
      }

      // 2. Try fetching live telemetry logs
      const remoteLogs = await apiService.getLogs(20);
      if (remoteLogs && remoteLogs.length > 0 && isMounted) {
        setEventLogs(prev => [...remoteLogs, ...prev]);
      }
    };

    hydrateBackend();
    return () => { isMounted = false; };
  }, []);

  // Helper to sync prescriptionItems with a DocumentRecord
  const syncPrescriptionItemsFromDoc = (doc: DocumentRecord) => {
    const items: PrescriptionItem[] = doc.extractedItems.map((item) => ({
      id: item.id,
      medicineName: item.name,
      dosage: item.dosage || '5 mg',
      frequency: item.frequency,
      frequencyCode: item.frequencyCode || 'OD',
      instruction: item.instruction || 'Take as directed',
      nextTriggerTime: item.triggerSlot,
      confidence: item.confidenceScore,
      sourceBox: item.sourceBox || { top: 36, left: 12, width: 76, height: 7 },
      status: item.status || 'verified',
      category: item.category,
      rawOcrText: item.rawOcrText || `${item.name} ${item.dosage || ''} ${item.frequencyCode || ''}`
    }));
    setPrescriptionItems(items);
    if (items.length > 0) {
      setSelectedRxId(items[0].id);
    }
  };

  // Set active document & sync items
  const setActiveDocument = (doc: DocumentRecord) => {
    setActiveDocumentState(doc);
    syncPrescriptionItemsFromDoc(doc);
  };

  // Switch parent dynamically & update all downstream reactive states
  const setActiveParent = (parent: ParentProfile) => {
    setActiveParentState(parent);
    
    // 1. Find or fallback to parent's document
    const parentDoc = documents.find((d) => d.parentId === parent.id) || documents[0];
    if (parentDoc) {
      setActiveDocumentState(parentDoc);
      syncPrescriptionItemsFromDoc(parentDoc);
    }

    // 2. Regenerate reactive tasks tailored to parent's vendors and location
    const newParentTasks = getTasksForParent(parent);
    setTasks(newParentTasks);

    // 3. Update agent pipeline nodes for this parent's phone and localization
    setAgentNodes(getAgentNodesForParent(parent));

    // 4. Log event in telemetry
    addEventLog({
      agentSource: 'Postgres State Planner',
      eventType: 'PARENT_PROFILE_CONTEXT_SWITCHED',
      severity: 'info',
      details: `Active monitoring context switched to ${parent.name} (${parent.city}, ${parent.preferredLanguage}). Vendor routing and documents synced.`,
      payload: {
        parentId: parent.id,
        parentName: parent.name,
        city: parent.city,
        chemist: parent.vendors.chemist.name,
        lpgProvider: parent.vendors.lpg.provider
      }
    });

    addToast({
      type: 'info',
      title: `Switched to ${parent.name}`,
      message: `Updated profile context, documents, and local vendor bindings for ${parent.city}.`
    });
  };

  // Dynamic upload document handler
  const uploadDocument = (file: File | { name: string; docType?: 'PRESCRIPTION' | 'ELECTRICITY_BILL' | 'PENSION_CERTIFICATE' }) => {
    const fileName = file.name;
    const isBill = fileName.toLowerCase().includes('bill') || fileName.toLowerCase().includes('sbpdcl');
    
    const newDocId = 'doc-' + Date.now();
    const newDoc: DocumentRecord = {
      id: newDocId,
      parentId: activeParent.id,
      fileName: fileName,
      docType: isBill ? 'ELECTRICITY_BILL' : 'PRESCRIPTION',
      issuer: isBill
        ? {
            title: 'SBPDCL Patna Urban Desk',
            subtitle: 'South Bihar Power Distribution Company Ltd',
            address: 'Vidyut Bhawan, Bailey Road, Patna - 800021',
            regOrConsumer: activeParent.vendors.electricity.consumerId
          }
        : {
            title: 'Dr. Rajiv N. Jha, M.D.',
            subtitle: 'Senior Consultant Physician & Geriatric Specialist',
            address: 'Fraser Road Chauraha, Patna - 800001',
            regOrConsumer: 'BCMR / 2015 / 8831'
          },
      patientOrConsumerName: activeParent.name,
      consultDate: 'Today',
      vitalsOrSummary: `${activeParent.vitals.bloodPressure} • Fasting: ${activeParent.vitals.bloodSugarFasting}`,
      extractedItems: isBill
        ? [
            {
              id: `item-${Date.now()}-1`,
              name: 'Electricity Consumption (Cycle Total)',
              dosage: 'LT Domestic',
              category: 'Utility',
              frequency: 'Once Daily (Morning)',
              frequencyCode: 'OD',
              instruction: 'Domestic slab with government power subsidy',
              triggerSlot: '18th of Every Month',
              confidenceScore: 0.99,
              rawOcrText: 'Net Payable Amount: ₹1,420.00',
              sourceBox: { top: 38, left: 12, width: 76, height: 7 },
              status: 'verified'
            }
          ]
        : [
            {
              id: `item-${Date.now()}-1`,
              name: 'Tab Cilnidipine',
              dosage: '10 mg',
              category: 'Cardio',
              frequency: 'Once Daily (Morning)',
              frequencyCode: 'OD',
              instruction: '1 tablet once daily morning after breakfast',
              triggerSlot: '08:00 AM Tomorrow',
              confidenceScore: 0.98,
              rawOcrText: 'Tab. Cilnidipine 10mg OD (Post Breakfast)',
              sourceBox: { top: 36, left: 12, width: 76, height: 7 },
              status: 'verified'
            },
            {
              id: `item-${Date.now()}-2`,
              name: 'Tab Metformin SR',
              dosage: '500 mg',
              category: 'Diabetes',
              frequency: 'Twice Daily (Morning & Night)',
              frequencyCode: 'BD',
              instruction: '1 tablet twice daily with principal meals',
              triggerSlot: '08:30 AM & 08:30 PM',
              confidenceScore: 0.96,
              rawOcrText: 'Tab. Metformin 500mg SR BD',
              sourceBox: { top: 46, left: 12, width: 76, height: 7 },
              status: 'verified'
            },
            {
              id: `item-${Date.now()}-3`,
              name: 'Tab Neurobion Forte',
              dosage: '1 B-Complex Tab',
              category: 'Supplement',
              frequency: 'Once Daily (Morning)',
              frequencyCode: 'OD',
              instruction: '1 tablet daily after lunch for nerve support',
              triggerSlot: '01:30 PM Tomorrow',
              confidenceScore: 0.94,
              rawOcrText: 'Tab. Neurobion Forte OD',
              sourceBox: { top: 56, left: 12, width: 76, height: 7 },
              status: 'verified'
            }
          ]
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setActiveDocument(newDoc);

    // Async post to backend if live
    apiService.postDocument(newDoc);

    addEventLog({
      agentSource: 'Guardrail Engine',
      eventType: 'DOCUMENT_OCR_INTAKE_PROCESSED',
      severity: 'success',
      details: `Parsed uploaded document "${fileName}". Extracted ${newDoc.extractedItems.length} entities with 97.2% confidence for ${activeParent.name}.`,
      payload: {
        fileName,
        patient: activeParent.name,
        docType: newDoc.docType,
        extractedCount: newDoc.extractedItems.length
      }
    });

    addToast({
      type: 'success',
      title: 'New Document Processed',
      message: `Extracted ${newDoc.extractedItems.length} entities from "${fileName}". Schedule table updated.`
    });
  };

  // Global Keyboard Shortcuts (1 -> Command Board, 2 -> Document Review, 3 -> Agent Pipeline)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }
      if (e.key === '1') {
        setActiveTab('command_board');
        playSound('ping');
      } else if (e.key === '2') {
        setActiveTab('document_intake');
        playSound('ping');
      } else if (e.key === '3') {
        setActiveTab('agent_trace');
        playSound('ping');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const addToast = (toast: Omit<ToastMessage, 'id'>) => {
    const id = 'toast-' + Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => {
      removeToast(id);
    }, toast.duration || 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const addEventLog = (log: Omit<EventLogItem, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
    const newLog: EventLogItem = {
      ...log,
      id: 'log-' + Math.random().toString(36).substring(2, 9),
      timestamp: timeStr
    };
    setEventLogs((prev) => [newLog, ...prev]);
  };

  const addCriticalFlag = (flag: Omit<CriticalFlag, 'id' | 'timestamp'>) => {
    const now = new Date();
    const timeStr = 'Today, ' + now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newFlag: CriticalFlag = {
      ...flag,
      id: 'flag-' + Math.random().toString(36).substring(2, 9),
      timestamp: timeStr,
      resolved: false
    };
    setCriticalFlags((prev) => [newFlag, ...prev]);
  };

  const resolveCriticalFlag = (id: string) => {
    setCriticalFlags((prev) =>
      prev.map((f) => (f.id === id ? { ...f, resolved: true } : f))
    );
    playSound('approval');
    addToast({
      type: 'success',
      title: 'Flag Resolved',
      message: 'Alert has been marked resolved in the guardrails log.'
    });
  };

  const approveTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    playSound('approval');

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    // Asynchronously call backend /api/tasks/:id/approve (failsafe/optimistic)
    apiService.approveTask(taskId);

    const isChemist = task.category === 'chemist';

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              column: 'done',
              title: isChemist
                ? `Chemist Order Dispatched — ${t.vendor || activeParent.vendors.chemist.name}`
                : t.title,
              subtitle: isChemist
                ? 'Medicines dispatched via WhatsApp Business API'
                : t.subtitle,
              badgeText: isChemist ? 'Dispatched via WhatsApp' : 'Approved & Dispatched',
              verificationMethod: isChemist
                ? `Authorized ₹${t.amount?.toFixed(2) || '340.00'} via WhatsApp Cloud API`
                : t.amount
                ? `Authorized ₹${t.amount.toFixed(2)} via Child Sign-off`
                : 'Approved by Child Dashboard'
            }
          : t
      )
    );

    addEventLog({
      agentSource: 'WhatsApp/UPI Action Agent',
      eventType: 'TRANSACTION_APPROVED_BY_CHILD',
      severity: 'success',
      details: isChemist
        ? `Child authorized order for ${task.vendor || activeParent.vendors.chemist.name}. Dispatched via WhatsApp API (${activeParent.vendors.chemist.phone}).`
        : `Child authorized action: "${task.title}" (₹${task.amount || 0}). Order dispatched to vendor.`,
      payload: {
        taskId: task.id,
        amount: task.amount || 0,
        authorizedAt: new Date().toISOString(),
        authType: 'CHILD_DASHBOARD_SIGN_OFF'
      }
    });

    addToast({
      type: 'success',
      title: 'Order & Payment Dispatched via WhatsApp API',
      message: isChemist
        ? `Chemist order for ${task.vendor || activeParent.vendors.chemist.name} has been dispatched via WhatsApp.`
        : `"${task.title}" has been authorized and moved to Completed.`
    });
  };

  const rejectTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    playSound('ping');

    // Asynchronously call backend /api/tasks/:id/reject (failsafe)
    apiService.rejectTask(taskId);
    
    addToast({
      type: 'info',
      title: 'Task Dismissed',
      message: `"${task?.title || 'Task'}" was removed from the approval queue.`
    });

    addEventLog({
      agentSource: 'Postgres State Planner',
      eventType: 'TRANSACTION_REJECTED',
      severity: 'warning',
      details: `Child rejected action: "${task?.title}". Cancelled dispatch queue.`,
      payload: { taskId }
    });
  };

  const resolveStockBlocker = (taskId: string, alternateChemist: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              column: 'needs_approval',
              vendor: alternateChemist,
              title: `Rerouted Refill — ${alternateChemist}`,
              subtitle: 'Medication re-routed for immediate local dispatch',
              badgeText: 'Rerouted (Pending Sign-off)',
              blockerDetails: undefined
            }
          : t
      )
    );

    playSound('approval');

    addEventLog({
      agentSource: 'WhatsApp/UPI Action Agent',
      eventType: 'STOCK_OUT_REROUTED',
      severity: 'success',
      details: `Rerouted failed medication order to alternate partner "${alternateChemist}". Moved to Approval Queue.`,
      payload: { taskId, alternateChemist }
    });

    addToast({
      type: 'success',
      title: 'Order Rerouted to ' + alternateChemist,
      message: 'Medication order moved to Approval Queue for final sign-off.'
    });
  };

  const approvePrescriptionSchedule = () => {
    playSound('approval');
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {}

    // Add prescription medicines as confirmed schedule tasks
    const newTasks: KanbanTask[] = prescriptionItems.map((item, index) => ({
      id: 'rx-task-' + item.id,
      title: `${item.medicineName} (${item.dosage})`,
      subtitle: `${item.frequency} — ${item.instruction}`,
      column: index === 0 ? 'done' : 'needs_approval',
      category: 'medication',
      time: item.nextTriggerTime.split(' ')[0] || '08:00 AM',
      date: 'Daily Schedule',
      verificationMethod: index === 0 ? 'Verified via Voice Call' : 'Schedule Active (Pending Next Slot)',
      badgeText: index === 0 ? 'Verified' : 'Schedule Queued',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      transcript: index === 0 ? tasks[0]?.transcript : undefined
    }));

    setTasks((prev) => {
      const existingIds = new Set(prev.map(p => p.id));
      const filteredNew = newTasks.filter(n => !existingIds.has(n.id));
      return [...filteredNew, ...prev];
    });

    setPrescriptionItems(prev => prev.map(p => ({ ...p, status: 'active' })));

    addEventLog({
      agentSource: 'Guardrail Engine',
      eventType: 'PRESCRIPTION_SCHEDULE_ACTIVATED',
      severity: 'success',
      details: `Child verified and activated ${prescriptionItems.length} items extracted from ${activeDocument.issuer.title} (${activeDocument.fileName}). IVR schedule synced for ${activeParent.name}.`,
      payload: {
        totalMedicines: prescriptionItems.length,
        doctor: activeDocument.issuer.title,
        patient: activeParent.name,
        approvedBy: 'Child Dashboard'
      }
    });

    addToast({
      type: 'success',
      title: 'Schedule Activated!',
      message: `${prescriptionItems.length} entities verified. IVR call agent & reminders are active for ${activeParent.name.split(' ')[0]}.`
    });

    setActiveTab('command_board');
  };

  // Stage Demo Triggers
  const triggerSimulateMorningCall = () => {
    playSound('approval');
    try {
      confetti({
        particleCount: 60,
        spread: 70,
        origin: { y: 0.7 }
      });
    } catch {}

    const isMother = activeParent.relation.toLowerCase().includes('mother');

    const newTask: KanbanTask = {
      id: 'sim-call-' + Date.now(),
      title: isMother ? 'Afternoon Sugar Check & Thyroid Followup' : 'Afternoon Sugar Check & Glimepiride',
      subtitle: 'Post-lunch vitals check & medicine reminder',
      column: 'done',
      category: 'medication',
      time: '01:45 PM',
      date: 'Just Now',
      verificationMethod: `Verified via ${activeParent.preferredLanguage.split('/')[0].trim()} voice call (0:42)`,
      badgeText: 'Live Voice Verified',
      guardrailStatus: {
        dosageVerified: true,
        financialChecked: true,
        emergencyScreened: true
      },
      transcript: {
        callId: 'SARVAM-SIM-' + Math.floor(10000 + Math.random() * 90000),
        duration: '0:42',
        timestamp: 'Just Now (Simulated)',
        audioSimulatedTime: 42,
        originalLang: activeParent.preferredLanguage,
        originalText: isMother 
          ? 'हाँ बेटा, दोपहर के भोजन के बाद आराम कर रहे हैं और दवाई समय पर ले ली है।'
          : 'हाँ बेटा, दोपहर का खाना खा लिया है और दवाई भी ले ली है। शुगर 138 आया है।',
        translatedText: isMother
          ? 'Yes child, resting after afternoon lunch and took the medicines on time.'
          : 'Yes son, had afternoon lunch and took the tablet too. Sugar reading is 138 mg/dL.',
        confidence: 0.99,
        sentiment: 'Positive',
        caller: 'Sahay AI Voice Agent (Sarvam AI)',
        receiver: activeParent.name + ` (${activeParent.phone})`,
        sarvamModel: 'Sarvam Saarathi-v2 (Indic STT)',
        keywordsDetected: ['खाना खा लिया (Had food)', 'दवाई ले ली (Took medicine)', 'सब ठीक है (All good)']
      }
    };

    setTasks((prev) => [newTask, ...prev]);

    addEventLog({
      agentSource: 'Sarvam Caller Agent',
      eventType: 'SIMULATED_VOICE_CALL_SUCCESS',
      severity: 'success',
      details: `Call completed with ${activeParent.name} (42s). Vitals & medication intake confirmed in ${activeParent.preferredLanguage}.`,
      payload: {
        parent: activeParent.name,
        duration: '0:42',
        sugarReading: '138 mg/dL',
        sentiment: 'Positive'
      }
    });

    addToast({
      type: 'success',
      title: 'Morning Call Completed',
      message: `Call with ${activeParent.name} completed (0:42). Medication confirmed in ${activeParent.preferredLanguage.split('/')[0]}.`
    });
  };

  const triggerSimulateMissedCall = () => {
    playSound('alert');
    const missedFlag: Omit<CriticalFlag, 'id' | 'timestamp'> = {
      type: 'missed_call',
      severity: 'high',
      title: `Missed 2 calls with ${activeParent.name}`,
      description: `Voice AI attempted calling ${activeParent.phone} at ${activeParent.address}. Both attempts timed out after 45s ringing.`,
      actionLabel: 'Direct Call Parent',
      resolved: false
    };

    addCriticalFlag(missedFlag);
    setIsAlertsDrawerOpen(true);

    addEventLog({
      agentSource: 'Sarvam Caller Agent',
      eventType: 'MISSED_CALL_ESCALATION',
      severity: 'warning',
      details: `Outbound call to ${activeParent.name} unanswered (2 attempts). Alert raised to dashboard.`,
      payload: {
        phone: activeParent.phone,
        attempts: 2,
        status: 'RING_NO_ANSWER'
      }
    });

    addToast({
      type: 'warning',
      title: 'Missed Call Alert Logged',
      message: `2 unanswered attempts recorded for ${activeParent.name}. Check Alerts drawer.`
    });
  };

  const triggerSimulateDistressAlert = () => {
    playSound('emergency');
    const distressFlag: CriticalFlag = {
      id: 'distress-sim-' + Date.now(),
      type: 'distress_keyword',
      severity: 'critical',
      title: `🚨 ${activeParent.name} reported dizziness ("Chakkar aa raha hai")`,
      description: `${activeParent.name} mentioned feeling dizzy at ${activeParent.address}. Sarvam ASR triggered instant emergency safeguard.`,
      timestamp: 'Just now',
      actionLabel: 'Emergency Protocol',
      audioSnippet: '...तनी चक्कर जइसन बुझाता बाबू, बाकिर अभी बैठल बानी...',
      resolved: false
    };

    setCriticalFlags((prev) => [distressFlag, ...prev]);
    setDistressAlertModalData(distressFlag);

    addEventLog({
      agentSource: 'Guardrail Engine',
      eventType: 'CRITICAL_DISTRESS_KEYWORD_DETECTED',
      severity: 'critical',
      details: `EMERGENCY ABORT: Keyword "चक्कर" (dizziness) detected in voice stream. Dispatched emergency push to family contacts.`,
      payload: {
        keyword: 'चक्कर (Dizziness)',
        parent: activeParent.name,
        confidence: 0.992,
        location: activeParent.address
      }
    });

    addToast({
      type: 'error',
      title: '🚨 CRITICAL DISTRESS ALERT',
      message: `${activeParent.name} reported dizziness during call! Emergency modal triggered.`,
      duration: 8000
    });
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        parents,
        activeParent,
        setActiveParent,
        documents,
        setDocuments,
        activeDocument,
        setActiveDocument,
        uploadDocument,
        tasks,
        setTasks,
        prescriptionItems,
        setPrescriptionItems,
        agentNodes,
        eventLogs,
        addEventLog,
        criticalFlags,
        resolveCriticalFlag,
        addCriticalFlag,
        isGuardrailsOpen,
        setIsGuardrailsOpen,
        isAlertsDrawerOpen,
        setIsAlertsDrawerOpen,
        isParentProfileOpen,
        setIsParentProfileOpen,
        activeTranscriptTask,
        setActiveTranscriptTask,
        activeWhatsAppTask,
        setActiveWhatsAppTask,
        activeChemistModalTask,
        setActiveChemistModalTask,
        activeAuditTask,
        setActiveAuditTask,
        distressAlertModalData,
        setDistressAlertModalData,
        approveTask,
        rejectTask,
        resolveStockBlocker,
        approvePrescriptionSchedule,
        triggerSimulateMorningCall,
        triggerSimulateMissedCall,
        triggerSimulateDistressAlert,
        toasts,
        addToast,
        removeToast,
        selectedRxId,
        setSelectedRxId
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
