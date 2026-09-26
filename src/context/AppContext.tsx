import React, { createContext, useContext, useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { playSound } from '../utils/audio';
import { apiService, onBackendStatusChange, getBackendStatus, toTaskType } from '../services/api';
import { processPrescriptionScan, convertToDocumentRecord } from '../services/geminiVision';
import { 
  parseUploadedDocument, 
  createImmutableEventLog, 
  evaluateFinancialGuardrail,
  normalizeFrequency,
  repairMedicineName
} from '../utils/clinicalNormalizer';
import {
  buildFieldDiff,
  isDosageCorrection,
  type ExtractedSnapshot
} from '../utils/extractionDiff';
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
  uploadDocument: (file: File | { name: string; docType?: 'PRESCRIPTION' | 'ELECTRICITY_BILL' | 'PENSION_CERTIFICATE'; previewImageUrl?: string }) => Promise<DocumentRecord>;
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
  approveTask: (taskId: string) => Promise<void>;
  rejectTask: (taskId: string) => Promise<void>;
  resolveStockBlocker: (taskId: string, alternateChemist: string) => void;
  approvePrescriptionSchedule: () => Promise<void>;
  
  // Demo & Guardrail Simulator Triggers (Phase 3 Tasks 3.1t & 3.2t)
  triggerSimulateMorningCall: () => void;
  triggerSimulateMissedCall: () => void;
  triggerSimulateRefillNeeded: () => void;
  triggerSimulateDistressAlert: () => void;
  triggerSimulateUnapprovedPayment: () => void;
  triggerSimulateDosageChangeAttempt: () => void;
  triggerResetDemo: () => void;
  
  // Toasts
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  
  // Phase 2 Backend & OCR Integration
  backendStatus: 'connected' | 'offline';
  refreshFromBackend: () => Promise<void>;
  isSyncing: boolean;
  hasHydrated: boolean;
  isOcrProcessing: boolean;
  
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
  const [prescriptionItems, setPrescriptionItems] = useState<PrescriptionItem[]>(() =>
    PRESCRIPTION_OCR_ITEMS.map(item => {
      const fullMedicineName = repairMedicineName(item.medicineName);
      const mapped = {
        ...item,
        medicineName: fullMedicineName
      };
      return { ...mapped, extracted: { ...mapped } as ExtractedSnapshot };
    })
  );
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
  const [backendStatus, setBackendStatus] = useState<'connected' | 'offline'>(() =>
    getBackendStatus() === 'connected' ? 'connected' : 'offline'
  );
  const [isOcrProcessing, setIsOcrProcessing] = useState<boolean>(false);

  // Real Postgres UUID for the active parent. The dashboard's own parent
  // ids ('parent-1', ...) are local-only and are rejected by the tasks
  // foreign key, so every write must use this instead. Null when offline.
  const [backendParentId, setBackendParentId] = useState<string | null>(null);

  // Real Postgres UUID per local document id, so tasks.source_document_id
  // satisfies its foreign key. Absent while offline.
  const [backendDocIds, setBackendDocIds] = useState<Record<string, string>>({});

  // Task 3.5t: distinguishes "still hydrating from the backend" from "the board is
  // genuinely empty", so the dashboard can show a skeleton rather than a blank page
  // on first paint.
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [hasHydrated, setHasHydrated] = useState<boolean>(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Function to pull live tasks and logs from Track C Backend (Task 2.6i)
  const refreshFromBackend = async () => {
    setIsSyncing(true);
    try {
      const isHealthy = await apiService.checkHealth();
      setBackendStatus(isHealthy ? 'connected' : 'offline');

      // 1. Fetch remote tasks from Track C (scoped to the real parent UUID)
      const remoteTasks = await apiService.getTasks(undefined, backendParentId ?? undefined);
      if (remoteTasks && remoteTasks.length > 0) {
        setTasks(prev => {
          const remoteMap = new Map(remoteTasks.map(t => [t.id, t]));
          const updated = prev.map(localTask => {
            const remote = remoteMap.get(localTask.id);
            if (remote) {
              remoteMap.delete(localTask.id);
              return {
                ...localTask,
                column: remote.column,
                title: remote.title || localTask.title,
                subtitle: remote.subtitle || localTask.subtitle
              };
            }
            return localTask;
          });
          return [...Array.from(remoteMap.values()), ...updated];
        });
      }

      // 2. Fetch live telemetry logs from Track C
      const remoteLogs = await apiService.getLogs(25);
      if (remoteLogs && remoteLogs.length > 0) {
        setEventLogs(prev => {
          const existingIds = new Set(prev.map(l => l.id));
          const newOnes = remoteLogs.filter(l => !existingIds.has(l.id));
          return newOnes.length > 0 ? [...newOnes, ...prev] : prev;
        });
      }
    } catch {
      setBackendStatus('offline');
    } finally {
      setIsSyncing(false);
      setHasHydrated(true);
    }
  };

  // Status listener & periodic polling (Task 2.6i)
  useEffect(() => {
    const unsub = onBackendStatusChange(status => {
      setBackendStatus(status === 'connected' ? 'connected' : 'offline');
    });

    refreshFromBackend();
    const interval = setInterval(refreshFromBackend, 4500);

    return () => {
      unsub();
      clearInterval(interval);
    };
  }, [backendParentId]);

  // Initial Backend Hydration (Optimistic & Offline-safe)
  useEffect(() => {
    let isMounted = true;
    const hydrateBackend = async () => {
      // 1. Resolve the real parent row so writes get a valid UUID foreign key
      const remoteParent = await apiService.getActiveParent();
      if (!isMounted) return;
      if (remoteParent) {
        setBackendParentId(remoteParent.id);
        setActiveParentState(prev => ({
          ...prev,
          name: remoteParent.name ?? prev.name,
          phone: remoteParent.phone ?? prev.phone,
          language: remoteParent.language ?? prev.language,
          city: remoteParent.city ?? prev.city,
          address: remoteParent.address ?? prev.address,
          vendors: { ...prev.vendors, ...remoteParent.vendors },
        }));
      }
    };

    hydrateBackend();
    return () => { isMounted = false; };
  }, []);

  // Helper to sync prescriptionItems with a DocumentRecord
  const syncPrescriptionItemsFromDoc = (doc: DocumentRecord) => {
    const items: PrescriptionItem[] = doc.extractedItems.map((item) => {
      const normalized = normalizeFrequency(item.frequency || item.frequencyCode || '');
      const fullMedicineName = repairMedicineName(item.name);
      const mapped = {
        id: item.id,
        medicineName: fullMedicineName,
        dosage: item.dosage || '10mg',
        frequency: item.frequency || normalized.frequency,
        frequencyCode: item.frequencyCode || normalized.frequencyCode,
        instruction: item.instruction || normalized.instruction,
        nextTriggerTime: item.triggerSlot || normalized.triggerSlot,
        confidence: item.confidenceScore,
        sourceBox: item.sourceBox || { top: 36, left: 12, width: 76, height: 7 },
        status: item.status || 'verified',
        category: item.category,
        rawOcrText: item.rawOcrText || `${fullMedicineName} ${item.dosage || ''} ${normalized.frequencyCode}`
      };
      // Task 2.5: freeze the machine reading so child edits can be diffed against it.
      return { ...mapped, extracted: { ...mapped } as ExtractedSnapshot };
    });
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
  // Dynamic upload document handler. Prefers the Track B service on the
  // Dynamic upload document handler. High-speed pipeline with fast fallback.
  const uploadDocument = async (file: File | { name: string; docType?: 'PRESCRIPTION' | 'ELECTRICITY_BILL' | 'PENSION_CERTIFICATE'; previewImageUrl?: string }): Promise<DocumentRecord> => {
    setIsOcrProcessing(true);
    let newDoc: DocumentRecord;
    const fileName = typeof file === 'string' ? file : file.name || 'prescription_document.png';
    let usedBackendOcr = false;

    // Fast-path for preset clicks (instant response without network latency)
    const isMockPreset = typeof file === 'string' || (!(file instanceof File) && !file.previewImageUrl);
    if (isMockPreset) {
      newDoc = parseUploadedDocument(file, activeParent);
      setDocuments((prev) => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
      setActiveDocument(newDoc);
      setIsOcrProcessing(false);
      return newDoc;
    }

    try {
      // 1. Try the real backend OCR pipeline first.
      const remote = await apiService.extractDocument(
        file instanceof File ? file : { fileName },
        activeParent.name
      );

      if (remote.success && remote.extractedItems && remote.extractedItems.length > 0) {
        newDoc = {
          id: `doc-remote-${Date.now()}`,
          parentId: activeParent.id,
          fileName,
          docType: (remote.documentType as DocumentRecord['docType']) || 'PRESCRIPTION',
          patientOrConsumerName: remote.patientOrConsumerName || activeParent.name,
          consultDate: remote.consultDate || new Date().toISOString(),
          vitalsOrSummary: remote.vitalsOrSummary || '',
          issuer: remote.issuer || {
            title: 'Unknown Issuer',
            subtitle: '',
            address: '',
            regOrConsumer: '',
          },
          extractedItems: remote.extractedItems,
        } as DocumentRecord;
        usedBackendOcr = true;
      } else {
        throw new Error(remote.error || 'Backend OCR returned no items');
      }
    } catch {
      // 2. Fall back to the in-browser engine, then the offline normalizer.
      try {
        const scanResult = await processPrescriptionScan(file);
        newDoc = convertToDocumentRecord(scanResult, activeParent.id, fileName);
      } catch (e) {
        console.warn('Vision scan fallback:', e);
        newDoc = parseUploadedDocument(file, activeParent);
      }
    }

    setDocuments((prev) => [newDoc, ...prev.filter(d => d.id !== newDoc.id)]);
    setActiveDocument(newDoc);
    setIsOcrProcessing(false);

    // Persist to Track C and remember the real document UUID for task FKs.
    apiService.postDocument(newDoc, backendParentId)
      .then(created => {
        if (created?.id) {
          setBackendDocIds(prev => ({ ...prev, [newDoc.id]: created.id }));
        }
      })
      .catch(() => {});

    const avgConf = Math.round(
      (newDoc.extractedItems.reduce((acc, i) => acc + (i.confidenceScore || 0.95), 0) / (newDoc.extractedItems.length || 1)) * 100
    );

    addEventLog({
      agentSource: 'Track B Vision OCR Pipeline',
      eventType: 'DOCUMENT_OCR_INTAKE_PROCESSED',
      severity: newDoc.extractedItems.length > 0 ? 'success' : 'warning',
      details: `Parsed "${newDoc.fileName}" via ${usedBackendOcr ? 'backend Gemini Vision' : 'in-browser OCR fallback'}. Extracted ${newDoc.extractedItems.length} entities at ${avgConf}% confidence for ${activeParent.name}.`,
      payload: {
        fileName: newDoc.fileName,
        patient: newDoc.patientOrConsumerName,
        docType: newDoc.docType,
        extractedCount: newDoc.extractedItems.length,
        extractionEngine: usedBackendOcr ? 'backend_gemini_vision' : 'browser_fallback',
        issuer: newDoc.issuer.title
      }
    });

    addToast({
      type: newDoc.extractedItems.length > 0 ? 'success' : 'warning',
      title: newDoc.extractedItems.length > 0
        ? 'Vision OCR Extraction Complete'
        : 'No Entities Detected',
      message: newDoc.extractedItems.length > 0
        ? `Extracted ${newDoc.extractedItems.length} entities from "${newDoc.fileName}". Schedule table ready for verification.`
        : `Nothing could be extracted from "${newDoc.fileName}". This file type may not be supported by the OCR engine.`
    });

    return newDoc;
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

  // Append-only tamper-evident immutable audit log writer
  const addEventLog = (log: Omit<EventLogItem, 'id' | 'timestamp'>) => {
    const immutableLog = createImmutableEventLog(log);
    setEventLogs((prev) => [immutableLog, ...prev]);
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

  // Only ids minted by Postgres can be driven through the real state machine.
  // Seed/demo rows keep their local ids and stay dashboard-only.
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isPersistedTask = (id: string) => UUID_RE.test(id);

  const approveTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    // Drive the real state machine first so we never show a success the
    // backend refused (e.g. a task that is not in awaiting_approval).
    let persisted = false;
    if (isPersistedTask(taskId)) {
      persisted = await apiService.approveTask(taskId);
      if (!persisted) {
        addToast({
          type: 'error',
          title: 'Approval Rejected by Backend',
          message: `"${task.title}" could not be approved. The state machine refused the transition — check the audit trail in Tab 3.`,
        });
        addEventLog({
          agentSource: 'Postgres State Planner',
          eventType: 'TASK_APPROVAL_REJECTED',
          severity: 'critical',
          details: `Backend refused approval for "${task.title}". State machine guardrail blocked the transition.`,
          payload: { taskId },
        });
        return;
      }
    }

    playSound('approval');

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    } catch {}

    const isChemist = task.category === 'chemist';
    const financialGate = evaluateFinancialGuardrail(task.amount);

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
        financialGateEvaluation: financialGate,
        authorizedAt: new Date().toISOString(),
        authType: 'CHILD_DASHBOARD_SIGN_OFF',
        persistedToDatabase: persisted
      }
    });

    addToast({
      type: persisted ? 'success' : 'info',
      title: persisted
        ? 'Approved & Recorded in Audit Log'
        : 'Approved (Dashboard Only)',
      message: persisted
        ? `"${task.title}" moved to Done and the state machine recorded awaiting_approval → done in Postgres.`
        : `"${task.title}" moved to Done locally. This demo row was never persisted, so no audit row was written.`
    });
  };

  const rejectTask = async (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);

    let persisted = false;
    if (isPersistedTask(taskId)) {
      persisted = await apiService.rejectTask(taskId);
    }

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    playSound('ping');

    addToast({
      type: 'info',
      title: 'Task Dismissed',
      message: `"${task?.title || 'Task'}" was removed from the approval queue${persisted ? ' and marked couldn\'t_complete in Postgres.' : '.'}`
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

  const approvePrescriptionSchedule = async () => {
    playSound('approval');
    try {
      confetti({
        particleCount: 80,
        spread: 80,
        origin: { y: 0.5 }
      });
    } catch {}

    setPrescriptionItems(prev => prev.map(p => ({ ...p, status: 'active' })));

    // Task 2.5: reconcile what the OCR engine read against what the child confirmed.
    const corrections = prescriptionItems
      .map(item => ({
        item,
        diff: buildFieldDiff(item.extracted, item as unknown as ExtractedSnapshot)
      }))
      .filter(entry => entry.diff.length > 0);

    const dosageCorrections = corrections.filter(entry => isDosageCorrection(entry.diff));

    // Phase 2 Integration (Tasks 2.2i & 2.6i): Persist schedule tasks to
    // Track C. Each task is created as `awaiting_approval` so it lands in the
    // child's approval queue in a legally reachable state — `pending` cannot
    // be approved, since the state machine only allows awaiting_approval -> done.
    // The returned UUID becomes the dashboard task id, so a later
    // approve/reject hits the real row instead of a local-only id.
    const docUuid = backendDocIds[activeDocument.id];
    // Quantity is not a field the OCR extracts, so derive a refill duration from
    // the prescription item. The backend Action-Taker substitutes this into the
    // {{2}} placeholder of the approved `order_confirmation` WhatsApp template.
    const REFILL_DAYS: Record<string, number> = { OD: 30, BD: 30, TDS: 30, HS: 30, SOS: 7 };
    const created = await Promise.all(
      prescriptionItems.map(item =>
        apiService.createTask({
          parent_id: backendParentId,
          task_type: toTaskType('chemist'),
          title: `${item.medicineName} (${item.dosage})`,
          description: `${item.frequency} — ${item.instruction}`,
          confidence_score: item.confidence,
          source_document_id: docUuid,
          status: 'awaiting_approval',
          // Consumed by backend/src/actionTaker.js when it builds the outbound
          // template message to the chemist.
          payload: {
            medicine_name: `${item.medicineName} ${item.dosage}`.trim(),
            quantity: `${REFILL_DAYS[item.frequencyCode] ?? 30} day supply`,
            delivery_address: [activeParent.address, activeParent.city, activeParent.pincode]
              .filter(Boolean)
              .join(', '),
            dosage: item.dosage,
            frequency: item.frequency,
            instructions: item.instruction,
          },
        })
      )
    );

    const persisted = created.filter(Boolean);
    const offline = persisted.length === 0;

    // Rebuild the board rows now that we know the real ids.
    const newTasks: KanbanTask[] = prescriptionItems.map((item, index) => ({
      id: persisted[index]?.id || 'rx-task-' + item.id,
      title: `${item.medicineName} (${item.dosage})`,
      subtitle: `${item.frequency} — ${item.instruction}`,
      column: index === 0 ? 'done' : 'needs_approval',
      category: 'chemist',
      time: item.nextTriggerTime.split(' ')[0] || '08:00 AM',
      date: 'Daily Schedule',
      verificationMethod: index === 0 ? 'Verified via Voice Call' : 'Schedule Active (Pending Next Slot)',
      badgeText: index === 0 ? 'Verified' : 'Schedule Queued',
      // Reflect reality: only items the child actually reviewed count as verified.
      guardrailStatus: {
        dosageVerified: item.status === 'active' || item.status === 'verified',
        financialChecked: true,
        emergencyScreened: true,
      },
      transcript: index === 0 ? tasks[0]?.transcript : undefined
    }));

    setTasks((prev) => {
      const existingIds = new Set(prev.map(p => p.id));
      const filteredNew = newTasks.filter(n => !existingIds.has(n.id));
      return [...filteredNew, ...prev];
    });

    addEventLog({
      agentSource: 'Guardrail Engine',
      eventType: 'PRESCRIPTION_SCHEDULE_ACTIVATED',
      severity: offline ? 'warning' : 'success',
      details: `${offline
        ? `Child verified and activated ${prescriptionItems.length} items from ${activeDocument.issuer.title} (${activeDocument.fileName}). Backend unreachable — schedule is local only and was NOT persisted.`
        : `Child verified and activated ${prescriptionItems.length} items extracted from ${activeDocument.issuer.title} (${activeDocument.fileName}). Persisted ${persisted.length}/${prescriptionItems.length} to Postgres as awaiting_approval.`} ${corrections.length} child correction(s) recorded against OCR output.`,
      payload: {
        totalMedicines: prescriptionItems.length,
        persistedCount: persisted.length,
        persistedToDatabase: !offline,
        doctor: activeDocument.issuer.title,
        patient: activeParent.name,
        approvedBy: 'Child Dashboard',
        extractionCorrections: corrections.length,
        dosageCorrections: dosageCorrections.length,
        correctionDiff: corrections.map(entry => ({
          itemId: entry.item.id,
          medicine: entry.item.medicineName,
          fields: entry.diff
        }))
      }
    });

    if (dosageCorrections.length > 0) {
      addEventLog({
        agentSource: 'Guardrail Engine',
        eventType: 'DOSAGE_STRENGTH_OVERRIDDEN_BY_CHILD',
        severity: 'warning',
        details: `Child manually overrode the OCR strength on ${dosageCorrections.length} item(s). The agent never alters dosages; the machine reading is retained in the audit ledger.`,
        payload: {
          items: dosageCorrections.map(entry => ({
            itemId: entry.item.id,
            medicine: entry.item.medicineName,
            ocrRead: entry.diff.find(d => d.field === 'dosage')?.extractedValue,
            childConfirmed: entry.diff.find(d => d.field === 'dosage')?.currentValue
          }))
        }
      });
    }

    addToast({
      type: offline ? 'warning' : 'success',
      title: offline ? 'Schedule Activated (Local Only)' : 'Schedule Activated!',
      message: `${prescriptionItems.length} entities verified${offline ? ', but the backend was unreachable so nothing was saved' : ' and written to Postgres'}. ${corrections.length} correction(s) logged. IVR call agent & reminders are active for ${activeParent.name.split(' ')[0]}.`,
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

  const triggerSimulateRefillNeeded = () => {
    playSound('ping');
    const chemist = activeParent.vendors.chemist;

    addEventLog({
      agentSource: 'Sarvam Caller Agent',
      eventType: 'STOCK_OUT_REFILL_INTENT_DETECTED',
      severity: 'info',
      details: `${activeParent.name} reported medication stock finished. Generated auto-draft WhatsApp refill order for ${chemist.name}.`,
      payload: {
        parent: activeParent.name,
        chemist: chemist.name,
        action: 'WHATSAPP_DRAFT_CREATED'
      }
    });

    addToast({
      type: 'info',
      title: 'Chemist Refill Order Drafted',
      message: `Refill needed for ${activeParent.name.split(' ')[0]}. WhatsApp order queued for ${chemist.name}.`
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

  // Phase 3 Task 3.1t: Guardrail Test for Unapproved Payment Attempt
  const triggerSimulateUnapprovedPayment = () => {
    playSound('alert');

    // Add a Critical Flag so it shows in the Alerts Drawer visually
    addCriticalFlag({
      type: 'guardrail_payment_blocked',
      severity: 'critical',
      title: `🛑 Blocked: ₹1,450 Auto-Debit Attempt`,
      description: `Guardrail Engine intercepted an unauthorized ₹1,450 payment to local vendor for ${activeParent.name}. Zero-autonomy financial policy enforced — no funds debited.`,
      actionLabel: 'Review Transaction Log',
      resolved: false
    });
    setIsAlertsDrawerOpen(true);

    addEventLog({
      agentSource: 'Guardrail Engine',
      eventType: 'UNAPPROVED_PAYMENT_BLOCKED',
      severity: 'critical',
      details: 'Task 3.1t Guardrail Check: Unauthorized payment attempt of ₹1,450 to local vendor was strictly intercepted and blocked. No funds debited.',
      payload: {
        attemptedAmount: 1450,
        currency: 'INR',
        guardrailRule: 'MAX_AUTONOMOUS_PAYMENT = 0',
        action: 'STRICT_BLOCK',
        status: 'PASSED_GUARDRAIL_TEST_3_1T'
      }
    });

    addToast({
      type: 'error',
      title: '🛑 Guardrail Blocked: Unapproved Payment',
      message: 'Autonomous payment of ₹1,450 strictly rejected by Policy Engine. Transactions require child authorization.',
      duration: 6000
    });
  };

  // Phase 3 Task 3.2t: Guardrail Test for Dosage Escalation Attempt
  const triggerSimulateDosageChangeAttempt = () => {
    playSound('alert');

    // Add a Critical Flag so it shows in the Alerts Drawer visually
    addCriticalFlag({
      type: 'guardrail_dosage_refused',
      severity: 'high',
      title: `⚕️ Refused: Dosage Change Request from ${activeParent.name}`,
      description: `Parent requested "दवाई का डोज़ बढ़ा दो, 2 गोली कर दो" during voice call. Agent firmly refused and redirected to physician review. No medication schedule altered.`,
      actionLabel: 'View Transcript Snippet',
      resolved: false
    });
    setIsAlertsDrawerOpen(true);

    addEventLog({
      agentSource: 'Guardrail Engine',
      eventType: 'DOSAGE_MODIFICATION_REFUSED',
      severity: 'critical',
      details: 'Task 3.2t Guardrail Check: Parent voice request "दवाई का डोज़ बढ़ा दो, 2 गोली कर दो" was intercepted and refused. Agent redirected to physician review.',
      payload: {
        transcriptSnippet: 'दवाई का डोज़ बढ़ा दो, 2 गोली कर दो',
        detectedIntent: 'ESCALATE_DOSAGE',
        guardrailRule: 'CANNOT_ALTER_MEDICATION_DOSAGE',
        action: 'REFUSE_AND_NOTIFY_CHILD',
        status: 'PASSED_GUARDRAIL_TEST_3_2T'
      }
    });

    addToast({
      type: 'warning',
      title: '⚕️ Clinical Guardrail: Dosage Change Refused',
      message: 'Agent firmly refused dose alteration request from call. Logged in telemetry for physician check.',
      duration: 6000
    });
  };

  // Phase 3 Task 3.6t: Reset Demo State (clears simulated flags/tasks for clean re-run)
  const triggerResetDemo = () => {
    setCriticalFlags(INITIAL_CRITICAL_FLAGS);
    setTasks(INITIAL_TASKS);
    setEventLogs(INITIAL_EVENT_LOGS);
    setIsAlertsDrawerOpen(false);
    setDistressAlertModalData(null);
    playSound('ping');
    addToast({
      type: 'info',
      title: 'Demo State Reset',
      message: 'All simulated flags, tasks, and logs cleared. Dashboard ready for a fresh stage run.'
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
        triggerSimulateRefillNeeded,
        triggerSimulateDistressAlert,
        triggerSimulateUnapprovedPayment,
        triggerSimulateDosageChangeAttempt,
        triggerResetDemo,
        toasts,
        addToast,
        removeToast,
        selectedRxId,
        setSelectedRxId,
        backendStatus,
        refreshFromBackend,
        isSyncing,
        hasHydrated,
        isOcrProcessing
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
