import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audio';
import type {
  KanbanTask,
  ParentProfile,
  PrescriptionItem,
  AgentNode,
  EventLogItem,
  CriticalFlag
} from '../data/mockData';
import {
  INITIAL_PARENTS,
  INITIAL_TASKS,
  PRESCRIPTION_OCR_ITEMS,
  AGENT_PIPELINE_NODES,
  INITIAL_EVENT_LOGS,
  INITIAL_CRITICAL_FLAGS
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
  const [activeParent, setActiveParent] = useState<ParentProfile>(INITIAL_PARENTS[0]);
  const [tasks, setTasks] = useState<KanbanTask[]>(INITIAL_TASKS);
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>(PRESCRIPTION_OCR_ITEMS);
  const [agentNodes] = useState<AgentNode[]>(AGENT_PIPELINE_NODES);
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

    // Play pleasant chime
    playSound('approval');

    // Trigger subtle confetti
    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {
      // Fallback
    }

    const isSharmaChemist = taskId === 'task-3';

    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              column: 'done',
              title: isSharmaChemist
                ? 'Chemist Order Dispatched — Sharma Medical (+91 98350 XXXXX)'
                : t.title,
              subtitle: isSharmaChemist
                ? 'Metformin 500mg + Amlodipine 5mg dispatched via WhatsApp Business'
                : t.subtitle,
              badgeText: isSharmaChemist ? 'Dispatched via WhatsApp' : 'Approved & Dispatched',
              verificationMethod: isSharmaChemist
                ? 'Authorized ₹340.00 via WhatsApp Cloud API'
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
      details: isSharmaChemist
        ? 'Child authorized Sharma Medical order. Dispatched via WhatsApp API (+91 94302 55441).'
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
      message: isSharmaChemist
        ? 'Chemist order for Sharma Medical Store has been dispatched via WhatsApp.'
        : `"${task.title}" has been authorized and moved to Completed.`
    });
  };

  const rejectTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    playSound('ping');
    
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
              subtitle: 'Vitamin D3 Chewable (Monthly Pack) re-routed for immediate dispatch',
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
      transcript: index === 0 ? INITIAL_TASKS[0].transcript : undefined
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
      details: `Child verified and activated 4 medicines extracted from Dr. S.K. Verma prescription. IVR schedule synced.`,
      payload: {
        totalMedicines: prescriptionItems.length,
        doctor: 'Dr. S.K. Verma, MD Patna',
        approvedBy: 'Yuvraj Atri (Son)'
      }
    });

    addToast({
      type: 'success',
      title: 'Prescription Schedule Activated!',
      message: '4 medicines verified. IVR call agent & reminders are now active.'
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

    const newTask: KanbanTask = {
      id: 'sim-call-' + Date.now(),
      title: 'Afternoon Sugar Check & Glimepiride',
      subtitle: 'Post-lunch vitals check & medicine reminder',
      column: 'done',
      category: 'medication',
      time: '01:45 PM',
      date: 'Just Now',
      verificationMethod: 'Verified via Hindi voice call (0:42)',
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
        originalLang: 'Hindi / Bhojpuri',
        originalText: 'हाँ बेटा, दोपहर का खाना खा लिया है और दवाई भी ले ली है। शुगर 138 आया है।',
        translatedText: 'Yes son, had afternoon lunch and took the tablet too. Sugar reading is 138 mg/dL.',
        confidence: 0.99,
        sentiment: 'Positive',
        caller: 'Sahay AI Voice Agent (Sarvam AI)',
        receiver: activeParent.name + ` (${activeParent.phone})`,
        sarvamModel: 'Sarvam Saarathi-v2 (Indic STT)',
        keywordsDetected: ['खाना खा लिया (Had food)', 'दवाई ले ली (Took medicine)', 'शुगर 138 (Sugar reading)']
      }
    };

    setTasks((prev) => [newTask, ...prev]);

    addEventLog({
      agentSource: 'Sarvam Caller Agent',
      eventType: 'SIMULATED_VOICE_CALL_SUCCESS',
      severity: 'success',
      details: `Call completed with ${activeParent.name} (42s). Vitals & medication intake confirmed in Hindi.`,
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
      message: `Call with ${activeParent.name} completed (0:42). Medication confirmed in Hindi.`
    });
  };

  const triggerSimulateMissedCall = () => {
    playSound('alert');
    const missedFlag: Omit<CriticalFlag, 'id' | 'timestamp'> = {
      type: 'missed_call',
      severity: 'high',
      title: `Missed Check-in Call with ${activeParent.name}`,
      description: `Voice AI attempted calling ${activeParent.phone} twice. Both attempts timed out after 45s ringing.`,
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
      title: '🚨 Parent reported dizziness ("Chakkar aa raha hai")',
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
      details: `EMERGENCY ABORT: Keyword "चक्कर" (dizziness) detected in voice stream. Dispatched emergency push to son.`,
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
