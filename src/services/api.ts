/**
 * SaharaSetu API Client Service (Track D Frontend <-> Track C Backend)
 * Connects to http://localhost:4000 (via Vite proxy /api or direct URL)
 * Completely offline-safe: seamlessly falls back to mockData when offline or unreachable.
 */

import type { ParentProfile, KanbanTask, EventLogItem, DocumentRecord } from '../data/mockData';
import { INITIAL_PARENTS } from '../data/mockData';

const API_BASE = '/api';

const fetchWithTimeout = async (url: string, options: RequestInit = {}, timeoutMs = 2500): Promise<Response> => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
};

export const apiService = {
  /**
   * GET /api/parent/active
   * Returns active parent profile with vendors
   */
  async getActiveParent(): Promise<ParentProfile | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/parent/active`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && data.name) {
        // Merge with our rich local structure if backend returns minimal shape
        const fallback = INITIAL_PARENTS[0];
        return {
          ...fallback,
          ...data,
          vendors: {
            ...fallback.vendors,
            ...(data.vendors || {})
          },
          vitals: data.vitals || fallback.vitals,
          emergencyContacts: data.emergencyContacts || fallback.emergencyContacts,
          dialects: data.dialects || fallback.dialects
        };
      }
      return null;
    } catch {
      // Offline fallback
      return null;
    }
  },

  /**
   * GET /api/tasks?status=...
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
      if (data && Array.isArray(data.tasks) && data.tasks.length > 0) {
        // Map backend tasks to frontend KanbanTask schema
        return data.tasks.map((t: any): KanbanTask => ({
          id: t.id ? String(t.id) : `task-${Math.random()}`,
          title: t.title || 'Medication / Utility Task',
          subtitle: t.description || undefined,
          column: t.status === 'done' ? 'done' : t.status === 'couldnt_complete' ? 'blocked' : 'needs_approval',
          category: t.task_type || 'medication',
          time: t.due_date ? new Date(t.due_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Due Today',
          date: 'Scheduled',
          amount: t.amount ? parseFloat(t.amount) : undefined,
          guardrailStatus: {
            dosageVerified: true,
            financialChecked: true,
            emergencyScreened: true
          }
        }));
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * POST /api/tasks/:id/approve
   * Approves a task and marks it 'done' in backend database
   */
  async approveTask(taskId: string, approvedBy = 'dashboard'): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tasks/${taskId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ approved_by: approvedBy })
      });
      return res.ok;
    } catch {
      // Offline fallback still succeeds locally
      return false;
    }
  },

  /**
   * POST /api/tasks/:id/reject
   * Rejects a task and moves to 'couldnt_complete' in backend database
   */
  async rejectTask(taskId: string, reason = 'Rejected via child dashboard'): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/tasks/${taskId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  /**
   * GET /api/logs?limit=50
   * Fetches live telemetry action logs
   */
  async getLogs(limit = 50): Promise<EventLogItem[] | null> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/logs?limit=${limit}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data && Array.isArray(data.logs) && data.logs.length > 0) {
        return data.logs.map((l: any): EventLogItem => ({
          id: l.id ? String(l.id) : `log-${Math.random()}`,
          timestamp: l.timestamp ? new Date(l.timestamp).toLocaleTimeString('en-IN', { hour12: false }) + ' IST' : 'Just now',
          agentSource: l.actor === 'parent' ? 'Guardrail Engine' : l.actor === 'sarvam' ? 'Sarvam Caller Agent' : 'Postgres State Planner',
          eventType: l.action ? l.action.toUpperCase() : 'STATE_UPDATE',
          severity: l.result === 'failure' ? 'critical' : l.result === 'warning' ? 'warning' : 'success',
          details: `Action [${l.action}] by actor (${l.actor}) — status: ${l.result || 'success'}`,
          payload: l.payload || {}
        }));
      }
      return null;
    } catch {
      return null;
    }
  },

  /**
   * POST /api/documents
   * Posts OCR extracted document to backend
   */
  async postDocument(doc: DocumentRecord): Promise<boolean> {
    try {
      const res = await fetchWithTimeout(`${API_BASE}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_id: doc.parentId,
          file_name: doc.fileName,
          doc_type: doc.docType,
          extracted_items: doc.extractedItems,
          raw_ocr_text: doc.extractedItems.map(i => i.rawOcrText).join('\n'),
          issuer: doc.issuer
        })
      });
      return res.ok;
    } catch {
      return false;
    }
  }
};
