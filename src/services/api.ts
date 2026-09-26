/**
 * SaharaSetu API Client Service (Track D Frontend <-> Track C Backend)
 * Phase 2 Integration: Live OCR extraction, task polling, and real-time sync.
 *
 * Connects to http://localhost:4000 (via Vite proxy /api)
 * Completely offline-safe: seamlessly falls back to mockData when backend is unreachable.
 */

import type { ParentProfile, KanbanTask, EventLogItem, DocumentRecord, ExtractedItem } from '../data/mockData';

const API_BASE = '/api';

/**
 * Task 2.4 — Clinical confidence gate.
 * Any line scoring below this threshold is forced to `needs_review` and can never
 * auto-activate, mirroring `GuardrailAudit.unverifiedMedicinesDetected` on the backend.
 */
export const CLINICAL_GATE_THRESHOLD = 0.6;

/**
 * Confidence assigned when the engine returns no usable score. Deliberately below
 * the gate so an unscored line can never masquerade as a verified extraction.
 */
export const UNSCORED_CONFIDENCE = 0.0;

/** Track backend connectivity for UI indicators */
let _lastBackendStatus: 'connected' | 'disconnected' = 'disconnected';
const _statusListeners: Array<(status: 'connected' | 'disconnected') => void> = [];

export function onBackendStatusChange(cb: (status: 'connected' | 'disconnected') => void) {
  _statusListeners.push(cb);
  return () => {
    const idx = _statusListeners.indexOf(cb);
    if (idx >= 0) _statusListeners.splice(idx, 1);
  };
}

function setBackendStatus(status: 'connected' | 'disconnected') {
  if (_lastBackendStatus !== status) {
    _lastBackendStatus = status;
    _statusListeners.forEach(cb => cb(status));
  }
}

export function getBackendStatus() {
  return _lastBackendStatus;
}

// ────────────────────────────────────────────────────────────────
// Vocabulary bridges between the dashboard and the Postgres schema.
// The DB constrains tasks.task_type to a fixed enum and drives
// tasks.status from the state machine, so neither can be passed
// through raw from the UI.
// ────────────────────────────────────────────────────────────────

/** Frontend KanbanTask.category -> tasks.task_type (CHECK constraint) */
const CATEGORY_TO_TASK_TYPE: Record<string, string> = {
  chemist: 'medicine_order',
  medication: 'medicine_order',
  utility: 'utility_payment',
  checkin: 'checkin',
  grocery: 'medicine_order',
};

/** tasks.task_type -> KanbanTask.category (reverse mapping for reads) */
const TASK_TYPE_TO_CATEGORY: Record<string, KanbanTask['category']> = {
  medicine_order: 'chemist',
  gas_booking: 'utility',
  utility_payment: 'utility',
  checkin: 'checkin',
};

export function toTaskType(category: string): string {
  return CATEGORY_TO_TASK_TYPE[category] || 'checkin';
}

/**
 * The board only has three columns, so anything still outstanding
 * (pending / awaiting_call / awaiting_approval) lands in the action
 * column. Only terminal states get their own column.
 */
export function toColumn(status: string): KanbanTask['column'] {
  if (status === 'done') return 'done';
  if (status === 'couldnt_complete') return 'blocked';
  return 'needs_approval';
}

/** Backend action_log rows -> EventLogItem for the Tab 3 trace view */
const ACTOR_TO_AGENT_SOURCE: Record<string, EventLogItem['agentSource']> = {
  planner: 'Postgres State Planner',
  voice_agent: 'Sarvam Caller Agent',
  action_taker: 'WhatsApp/UPI Action Agent',
  guardrail: 'Guardrail Engine',
  system: 'Track B Vision OCR Pipeline',
};

const RESULT_TO_SEVERITY: Record<string, EventLogItem['severity']> = {
  success: 'success',
  blocked: 'critical',
  failed: 'warning',
  failed_no_answer: 'warning',
};

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 4000): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    setBackendStatus('connected');
    return response;
  } catch (error) {
    clearTimeout(id);
    setBackendStatus('disconnected');
    throw error;
  }
};

export const apiService = {
  /**
   * GET /api/health — check backend connectivity
   */
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/health`, {}, 2000);
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * GET /api/parent/active
   * Returns active parent profile with vendors (silent fallback).
   * Note: the backend `id` is a real UUID — callers must use it for
   * foreign keys rather than the dashboard's local parent id.
   */
  async getActiveParent(): Promise<(Partial<ParentProfile> & { id: string }) | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/parent/active`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!data || !data.id) return null;
      return {
        id: String(data.id),
        name: data.name,
        phone: data.phone,
        language: data.language,
        city: data.city,
        address: data.address,
        vendors: data.vendors,
      };
    } catch {
      return null;
    }
  },

  /**
   * GET /api/parents — every registered parent, used to resolve
   * local dashboard profiles to their real database UUIDs.
   */
  async getParents(): Promise<Array<{ id: string; name: string; phone: string; city: string }>> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/parents`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return Array.isArray(data.parents) ? data.parents : [];
    } catch {
      return [];
    }
  },

  /**
   * GET /api/tasks?status=...
   * Fetches tasks from backend and maps to frontend KanbanTask schema.
   * Returns null when offline so the caller can keep using local state.
   */
  async getTasks(status?: string, parentId?: string): Promise<KanbanTask[] | null> {
    try {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (parentId) params.set('parent_id', parentId);
      const url = `${API_BASE}/tasks${params.toString() ? '?' + params.toString() : ''}`;

      const res = await fetchWithTimeout(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.tasks)) return null;

      return data.tasks.map((t: any): KanbanTask => ({
        id: String(t.id),
        title: t.title || 'Medication / Utility Task',
        subtitle: t.description || undefined,
        column: toColumn(t.status),
        category: TASK_TYPE_TO_CATEGORY[t.task_type] || 'checkin',
        time: t.due_date
          ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Due Today',
        date: 'Scheduled',
        amount: t.amount != null ? parseFloat(t.amount) : undefined,
        // Reflect the real backend state instead of asserting every check passed.
        guardrailStatus: {
          dosageVerified: t.status === 'done',
          financialChecked: t.status === 'done' || t.status === 'awaiting_approval',
          emergencyScreened: true,
        },
      }));
    } catch {
      return null;
    }
  },

  /**
   * POST /api/tasks/:id/approve
   * Drives the real state machine (awaiting_approval -> done).
   * Resolves false when the backend refuses, e.g. the task is not in
   * a legally approvable state.
   */
  async approveTask(taskId: string, approvedBy = 'dashboard'): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tasks/${encodeURIComponent(taskId)}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: approvedBy }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * POST /api/tasks/:id/reject
   */
  async rejectTask(taskId: string, reason = 'Rejected via child dashboard'): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tasks/${encodeURIComponent(taskId)}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * GET /api/logs?limit=50
   */
  async getLogs(limit = 50): Promise<EventLogItem[] | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/logs?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data.logs)) return null;

      return data.logs.map((row: any): EventLogItem => ({
        id: `backend-log-${row.id}`,
        timestamp: row.timestamp,
        agentSource: ACTOR_TO_AGENT_SOURCE[row.actor] || 'Postgres State Planner',
        eventType: String(row.action || 'action').toUpperCase(),
        severity: RESULT_TO_SEVERITY[row.result] || 'info',
        details: `${row.actor} → ${row.action} (${row.result})`,
        payload: row.payload || {},
      }));
    } catch {
      return null;
    }
  },

  /**
   * POST /api/documents
   * Resolves to the created row (so callers can capture the real UUID for
   * tasks.source_document_id), or null when offline.
   */
  async postDocument(doc: DocumentRecord, parentUuid?: string | null): Promise<{ id: string } | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // documents.parent_id is a UUID FK — the dashboard's local parent
          // id is not, so prefer the resolved backend UUID when we have one.
          parent_id: parentUuid || null,
          file_name: doc.fileName,
          doc_type: doc.docType,
          extracted_items: doc.extractedItems,
          raw_ocr_text: doc.extractedItems.map(i => i.rawOcrText).join('\n'),
          issuer: doc.issuer
        })
      });
      if (!res.ok) return null;
      const row = await res.json();
      return row && row.id ? { id: String(row.id) } : null;
    } catch {
      return null;
    }
  },

  /**
   * POST /api/ocr/extract  (Track B Vision OCR — Phase 2 Integration)
   * Sends either a real file (multipart/form-data) or document metadata (JSON)
   * to the Track B OCR extraction pipeline.
   * Returns structured extracted items from Gemini Vision or grounded clinical fallback.
   */
  async extractDocument(
    input: File | { fileName: string; patientName?: string; base64Image?: string },
    patientNameArg?: string
  ): Promise<{
    success: boolean;
    documentType?: string;
    patientOrConsumerName?: string;
    consultDate?: string;
    vitalsOrSummary?: string;
    issuer?: {
      title: string;
      subtitle: string;
      address: string;
      regOrConsumer: string;
    };
    extractedItems?: ExtractedItem[];
    guardrailAudit?: {
      dosageAltered: boolean;
      unverifiedMedicinesDetected: number;
      status: string;
    };
    error?: string;
  }> {
    try {
      let res: Response;

      if (input instanceof File) {
        const formData = new FormData();
        formData.append('file', input);
        formData.append('patientName', patientNameArg || 'Ramakant Mishra');

        res = await fetchWithTimeout(`${API_BASE}/ocr/extract`, {
          method: 'POST',
          body: formData
        }, 15000);
      } else {
        res = await fetchWithTimeout(`${API_BASE}/ocr/extract`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileName: input.fileName,
            patientName: input.patientName || patientNameArg || 'Ramakant Mishra',
            base64Image: input.base64Image
          })
        }, 15000);
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        return { success: false, error: errData.error || `HTTP ${res.status}` };
      }

      const data = await res.json();

      // Map backend OCR response to frontend ExtractedItem shape
      const items: ExtractedItem[] = (data.extractedItems || []).map((item: any, idx: number) => {
        // Task 2.4: never invent a confidence. A missing or unparseable score is
        // treated as unverified and forced through the 0.60 clinical gate, because
        // a fabricated "95%" would defeat the entire human-verification safeguard.
        const rawScore = Number(item.confidenceScore);
        const hasScore = Number.isFinite(rawScore) && rawScore >= 0 && rawScore <= 1;
        const confidenceScore = hasScore ? rawScore : UNSCORED_CONFIDENCE;
        return {
        id: item.id || `ocr-item-${Date.now()}-${idx}`,
        name: item.name || item.medicineName || 'Unknown Item',
        dosage: item.strength || item.dosage || '',
        category: item.category || 'Medication',
        frequency: item.frequency || 'Once Daily (Morning)',
        frequencyCode: item.frequencyCode || 'OD',
        instruction: item.instructions || item.instruction || 'Take as directed',
        triggerSlot: item.triggerSlot || '08:00 AM',
        confidenceScore,
        refillDays: typeof item.refillDays === 'number' ? item.refillDays : 30,
        rawOcrText: item.rawOcrText || `${item.name} ${item.strength || ''}`,
        sourceBox: item.boundingBox
          ? {
              top: Math.round((item.boundingBox[0] / 1000) * 100),
              left: Math.round((item.boundingBox[1] / 1000) * 100),
              width: Math.round(((item.boundingBox[3] - item.boundingBox[1]) / 1000) * 100),
              height: Math.round(((item.boundingBox[2] - item.boundingBox[0]) / 1000) * 100)
            }
          : { top: 36 + idx * 10, left: 12, width: 76, height: 7 },
        status: confidenceScore < CLINICAL_GATE_THRESHOLD ? 'needs_review' : 'verified'
        };
      });

      return {
        success: true,
        documentType: data.documentType || 'PRESCRIPTION',
        patientOrConsumerName: data.patientOrConsumerName || patientNameArg || 'Ramakant Mishra',
        consultDate: data.consultDate || 'Today',
        vitalsOrSummary: data.vitalsOrSummary || 'Vitals Normal',
        issuer: data.issuer || {
          title: 'Dr. S. K. Verma, M.D.',
          subtitle: 'Consultant Physician & Cardiologist',
          address: 'Exhibition Road Chauraha, Patna - 800001',
          regOrConsumer: 'BCMR / 2004 / 4891'
        },
        extractedItems: items,
        guardrailAudit: data.guardrailAudit
      };
    } catch {
      return { success: false, error: 'Backend unreachable — using grounded fallback extraction.' };
    }
  },

  /**
   * POST /api/tasks — create a new task from OCR extraction
   * Used after child verifies a prescription schedule.
   * `status` seeds the state machine; only pre-activation states are
   * accepted by the backend (terminal states must go through approve/reject).
   */
  async createTask(task: {
    parent_id?: string | null;
    task_type: string;
    title: string;
    description: string;
    due_date?: string;
    amount?: number;
    confidence_score?: number;
    source_document_id?: string;
    status?: 'pending' | 'awaiting_call' | 'awaiting_approval';
    /** Per-task action arguments the backend Action-Taker uses to build the
     *  outbound WhatsApp template (medicine_order needs name/quantity/address). */
    payload?: Record<string, string>;
  }): Promise<any | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        console.warn('[api] createTask rejected:', err.error);
        return null;
      }
      return await res.json();
    } catch {
      return null;
    }
  }
};
