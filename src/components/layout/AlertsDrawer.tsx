import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  AlertOctagon, 
  PhoneCall, 
  PhoneMissed, 
  CheckCircle2, 
  Volume2,
  ShieldOff,
  Pill
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AlertsDrawer: React.FC = () => {
  const { 
    isAlertsDrawerOpen, 
    setIsAlertsDrawerOpen, 
    criticalFlags, 
    resolveCriticalFlag, 
    setDistressAlertModalData, 
    activeParent, 
    addToast 
  } = useApp();

  if (!isAlertsDrawerOpen) return null;

  const unresolvedFlags = criticalFlags.filter(f => !f.resolved);

  const handleDirectCall = () => {
    addToast({
      type: 'info',
      title: 'Connecting Direct Call',
      message: `Dialing ${activeParent.name} (${activeParent.phone}) via prioritized voice gateway...`
    });
  };

  // Resolve visual classification for each flag type
  const getFlagVisuals = (flagType: string) => {
    switch (flagType) {
      case 'distress_keyword':
        return {
          borderClass: 'border-rose-400 bg-rose-50/70 shadow-xs',
          iconBg: 'bg-rose-600 text-white',
          icon: <AlertOctagon className="w-4 h-4 animate-pulse" />,
          badgeClass: 'bg-rose-200 text-rose-900',
          badgeLabel: 'EMERGENCY DISTRESS'
        };
      case 'guardrail_payment_blocked':
        return {
          borderClass: 'border-red-400 bg-red-50/80 shadow-sm shadow-red-200/40',
          iconBg: 'bg-red-700 text-white',
          icon: <ShieldOff className="w-4 h-4" />,
          badgeClass: 'bg-red-200 text-red-900',
          badgeLabel: '🛑 PAYMENT BLOCKED'
        };
      case 'guardrail_dosage_refused':
        return {
          borderClass: 'border-orange-400 bg-orange-50/70 shadow-sm shadow-orange-200/40',
          iconBg: 'bg-orange-600 text-white',
          icon: <Pill className="w-4 h-4" />,
          badgeClass: 'bg-orange-200 text-orange-900',
          badgeLabel: '⚕️ DOSAGE CHANGE REFUSED'
        };
      case 'missed_call':
      default:
        return {
          borderClass: 'border-amber-300 bg-amber-50/70 shadow-xs',
          iconBg: 'bg-amber-600 text-white',
          icon: <PhoneMissed className="w-4 h-4" />,
          badgeClass: 'bg-amber-200 text-amber-900',
          badgeLabel: 'MISSED CALL WARNING'
        };
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-sm flex justify-end">
        {/* Backdrop click */}
        <div 
          className="absolute inset-0"
          onClick={() => setIsAlertsDrawerOpen(false)}
        />

        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 220 }}
          className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col z-10 border-l border-slate-200"
        >
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertOctagon className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm">Critical System Alerts</h3>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white font-mono">
                    {unresolvedFlags.length} Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">Task 4.5: Immediate child notifications</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close alerts drawer"
              onClick={() => setIsAlertsDrawerOpen(false)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {unresolvedFlags.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">No Critical Flags</h4>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  All routine voice check-ins, medication logs, and automated alerts are running smoothly.
                </p>
              </div>
            ) : (
              unresolvedFlags.map((flag) => {
                const isDistress = flag.type === 'distress_keyword';
                const isMissedCall = flag.type === 'missed_call';
                const isGuardrail = flag.type === 'guardrail_payment_blocked' || flag.type === 'guardrail_dosage_refused';
                const visuals = getFlagVisuals(flag.type);

                return (
                  <motion.div
                    key={flag.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border-2 space-y-3 transition-all ${visuals.borderClass}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${visuals.iconBg}`}
                        >
                          {visuals.icon}
                        </div>
                        <div>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded inline-block mb-1 ${visuals.badgeClass}`}
                          >
                            {visuals.badgeLabel}
                          </span>
                          <h4 className="text-xs font-semibold text-slate-900 leading-tight">
                            {flag.title}
                          </h4>
                        </div>
                      </div>

                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {flag.timestamp}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed pl-10">
                      {flag.description}
                    </p>

                    {/* Audio snippet chip if distress */}
                    {isDistress && flag.audioSnippet && (
                      <div
                        onClick={() => setDistressAlertModalData(flag)}
                        className="ml-10 p-2 bg-white rounded-lg border border-rose-200 flex items-center justify-between text-xs text-rose-800 cursor-pointer hover:bg-rose-100/50 transition-colors"
                      >
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <Volume2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span className="italic truncate">&ldquo;{flag.audioSnippet}&rdquo;</span>
                        </span>
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded shrink-0">
                          View Protocol
                        </span>
                      </div>
                    )}

                    {/* Guardrail-specific info chip */}
                    {isGuardrail && (
                      <div className="ml-10 p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
                        <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                          <ShieldOff className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>Guardrail Enforcement Active</span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {flag.type === 'guardrail_payment_blocked'
                            ? 'Zero-autonomy financial shield engaged. Every transaction strictly requires 1-click child sign-off before any funds leave the system.'
                            : 'Clinical boundary active. Only verified physicians can alter dosage. Agent redirected parent to consult their doctor.'}
                        </p>
                      </div>
                    )}

                    {/* Action buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/80 ml-10">
                      {isMissedCall ? (
                        <button
                          type="button"
                          onClick={handleDirectCall}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                          <span>Direct Call Parent</span>
                        </button>
                      ) : isGuardrail ? (
                        <button
                          type="button"
                          onClick={() => resolveCriticalFlag(flag.id)}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Acknowledge & Resolve</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDistressAlertModalData(flag)}
                          className="px-3 py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-medium rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <AlertOctagon className="w-3.5 h-3.5" />
                          <span>Trigger Distress Protocol</span>
                        </button>
                      )}

                      {!isGuardrail && (
                        <button
                          type="button"
                          onClick={() => resolveCriticalFlag(flag.id)}
                          className="text-xs text-slate-500 hover:text-emerald-700 font-semibold flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Resolved</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Auto-escalates to SMS if unanswered for 3 mins.
            </span>
            <button
              type="button"
              onClick={() => setIsAlertsDrawerOpen(false)}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
