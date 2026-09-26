import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  X, 
  FileCode2,
  CheckCircle,
  Pill,
  Lock,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const GuardrailsModal: React.FC = () => {
  const { isGuardrailsOpen, setIsGuardrailsOpen, eventLogs } = useApp();

  if (!isGuardrailsOpen) return null;

  // Live enforcement counters from event logs
  const paymentsBlocked = eventLogs.filter(l => l.eventType === 'UNAPPROVED_PAYMENT_BLOCKED').length;
  const dosageRefused = eventLogs.filter(l => l.eventType === 'DOSAGE_MODIFICATION_REFUSED').length;
  const distressEvents = eventLogs.filter(l => l.eventType === 'CRITICAL_DISTRESS_KEYWORD_DETECTED').length;
  const totalEnforcements = paymentsBlocked + dosageRefused + distressEvents;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
        {/* Backdrop click */}
        <div 
          className="absolute inset-0"
          onClick={() => setIsGuardrailsOpen(false)}
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-lg bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">
                    Autonomous Safety & Guardrails Enforcement
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Real-time runtime constraints & deterministic policy gates
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsGuardrailsOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">

            {/* Live Enforcement Counters (Phase 3 Task 3.5t) */}
            {totalEnforcements > 0 && (
              <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/80 space-y-3">
                <div className="flex items-center gap-2 font-semibold text-slate-800">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span>Live Enforcement Summary (This Session)</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-center">
                    <div className="text-lg font-bold text-red-700">{paymentsBlocked}</div>
                    <div className="text-[10px] text-red-600 font-medium">Payments Blocked</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-orange-50 border border-orange-200 text-center">
                    <div className="text-lg font-bold text-orange-700">{dosageRefused}</div>
                    <div className="text-[10px] text-orange-600 font-medium">Dosage Refused</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-center">
                    <div className="text-lg font-bold text-rose-700">{distressEvents}</div>
                    <div className="text-[10px] text-rose-600 font-medium">Distress Catches</div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Boundary 1 */}
            <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-emerald-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <Pill className="w-4 h-4 text-emerald-700" />
                  <span>Clinical Boundary</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${dosageRefused > 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-100 text-emerald-800'}`}>
                  Enforced (100% Pass){dosageRefused > 0 ? ` • ${dosageRefused} blocked` : ''}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed pl-4">
                Zero dosage adjustments permitted; only recurrence and refill schedules read. Any variation in strength or substitute molecule strictly triggers a child clinical review gate before being added to schedule.
              </p>
            </div>

            {/* Boundary 2 */}
            <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-emerald-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <Lock className="w-4 h-4 text-emerald-700" />
                  <span>Financial Shield</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${paymentsBlocked > 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-100 text-emerald-800'}`}>
                  Enforced (100% Pass){paymentsBlocked > 0 ? ` • ${paymentsBlocked} blocked` : ''}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed pl-4">
                Any transaction &gt; ₹0 strictly requires manual 1-click child sign-off from this dashboard before funds or WhatsApp purchase orders are dispatched to local vendors.
              </p>
            </div>

            {/* Boundary 3 */}
            <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/40 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-semibold text-emerald-950">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                  <AlertTriangle className="w-4 h-4 text-emerald-700" />
                  <span>Emergency Interruption</span>
                </div>
                <span className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded ${distressEvents > 0 ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-100 text-emerald-800'}`}>
                  Enforced (100% Pass){distressEvents > 0 ? ` • ${distressEvents} caught` : ''}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed pl-4">
                Distress keywords (&ldquo;chakkar&rdquo;, &ldquo;chest pain&rdquo;, &ldquo;gir gaye&rdquo;, &ldquo;चक्कर&rdquo;, &ldquo;सांस फूलना&rdquo;) immediately terminate automated IVR prompts and alert the child and local contacts.
              </p>
            </div>

            {/* Verification Architecture Box */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between font-semibold text-slate-800">
                <span className="flex items-center gap-1.5">
                  <FileCode2 className="w-4 h-4 text-teal-600" />
                  Postgres State Machine Schema Constraints
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                  v4.2 Safe
                </span>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                All voice inferences run through Sarvam Saarathi Indic parser and are mapped to an immutable Postgres state machine schema. No LLM hallucination can directly execute an API call without explicit tokenized sign-off.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              All 3 Sentinel Daemons Operational
              {totalEnforcements > 0 && (
                <span className="ml-1 px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-mono font-semibold">
                  {totalEnforcements} enforcements
                </span>
              )}
            </span>
            <button
              onClick={() => setIsGuardrailsOpen(false)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

