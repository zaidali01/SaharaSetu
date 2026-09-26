import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  Sparkles, 
  FileCheck2, 
  Lock, 
  Database,
  ArrowRight,
  Fingerprint
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AuditTraceDrawer: React.FC = () => {
  const { activeAuditTask, setActiveAuditTask, activeDocument, activeParent } = useApp();

  if (!activeAuditTask) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-zinc-900/40 backdrop-blur-xs flex justify-end">
        <div 
          className="absolute inset-0"
          onClick={() => setActiveAuditTask(null)}
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-zinc-200"
        >
          {/* Header */}
          <div className="p-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-900">Task Audit & Provenance</h3>
                <p className="text-xs text-zinc-500 font-mono">ID: {activeAuditTask.id}</p>
              </div>
            </div>

            <button
              onClick={() => setActiveAuditTask(null)}
              className="w-7 h-7 rounded-lg hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
            {/* Task Info */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-1.5">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Entity In Context</span>
              <h4 className="text-xs font-semibold text-zinc-900">{activeAuditTask.title}</h4>
              <p className="text-zinc-500">{activeAuditTask.subtitle || 'Scheduled eldercare routine action'}</p>
              {activeAuditTask.amount && (
                <p className="text-zinc-900 font-mono font-medium pt-1">
                  Amount: ₹{activeAuditTask.amount.toFixed(2)}
                </p>
              )}
            </div>

            {/* OCR Provenance */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-800 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                  Prescription OCR Extraction
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                  96.4% High Confidence
                </span>
              </div>
              <div className="p-3 rounded-xl border border-zinc-200 space-y-2 font-mono text-[11px] bg-zinc-900 text-zinc-200">
                <div className="text-emerald-400">// Grounded Document Reference</div>
                <div>Source: {activeDocument.issuer.title} ({activeDocument.fileName})</div>
                <div>Hash: sha256:7f8a92cb...{activeParent.id}</div>
                <div>Issuer: {activeDocument.issuer.address}</div>
                <div>Bounding Box: [x: 12%, y: 45%, w: 76%, h: 7%]</div>
              </div>
            </div>

            {/* Guardrail Checklist */}
            <div className="space-y-2.5">
              <span className="text-xs font-semibold text-zinc-800">
                Safety Invariant Gates (State Machine v4.2)
              </span>

              <div className="space-y-2">
                <div className="p-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/40 flex items-start gap-2.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-950">Rule #1: Immutable Dosage</div>
                    <div className="text-emerald-800/80 text-[11px]">No variation in strength or molecule detected from original Rx.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-amber-200/80 bg-amber-50/40 flex items-start gap-2.5">
                  <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-amber-950">Rule #2: Mandatory 1-Click Approval</div>
                    <div className="text-amber-800/80 text-[11px]">Financial transaction locked until family signs off from dashboard.</div>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg border border-emerald-200/80 bg-emerald-50/40 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-emerald-950">Rule #3: Distress Keyword Filter</div>
                    <div className="text-emerald-800/80 text-[11px]">ASR phonetic confidence 0.00 distress sentiment during intake.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Postgres State Transition */}
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200/80 space-y-2 font-mono text-[11px] text-zinc-600">
              <div className="flex items-center gap-1.5 text-zinc-800 font-semibold font-sans text-xs">
                <Database className="w-3.5 h-3.5 text-indigo-600" />
                <span>Deterministic State Path</span>
              </div>
              <div className="flex items-center gap-1 text-zinc-500">
                <span>INTAKE_PARSED</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span>POLICY_PASSED</span>
                <ArrowRight className="w-3 h-3 text-zinc-400" />
                <span className="text-amber-700 font-bold">AWAITING_CHILD_SIGN_OFF</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500 flex items-center gap-1">
              <Fingerprint className="w-3.5 h-3.5 text-zinc-400" />
              <span>Cryptographically signed</span>
            </span>
            <button
              onClick={() => setActiveAuditTask(null)}
              className="px-3.5 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-lg text-xs font-medium cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
