import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhoneCall, 
  PhoneMissed, 
  AlertOctagon, 
  Zap, 
  X,
  ShieldAlert,
  Pill,
  RotateCcw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DemoSimulatorBar: React.FC = () => {
  const { 
    triggerSimulateMorningCall, 
    triggerSimulateMissedCall, 
    triggerSimulateDistressAlert,
    triggerSimulateUnapprovedPayment,
    triggerSimulateDosageChangeAttempt,
    triggerResetDemo
  } = useApp();

  const [isOpen, setIsOpen] = useState(false);

  return (
    <aside aria-label="Demo Tools Dock" className="fixed bottom-6 right-6 z-50">
      <AnimatePresence mode="wait">
        {!isOpen ? (
          /* Small default launcher button */
          <motion.button
            key="launcher"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-900/95 hover:bg-slate-800 text-white rounded-xl shadow-xl border border-slate-700/80 text-xs font-semibold backdrop-blur-md cursor-pointer transition-all hover:shadow-teal-500/10"
          >
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            <Zap className="w-3.5 h-3.5 text-teal-400" />
            <span>⚡ Demo Tools</span>
          </motion.button>
        ) : (
          /* Expanded dock */
          <motion.div
            key="dock"
            initial={{ y: 20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 20, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-3.5 flex flex-col gap-2.5 w-72 max-h-[85vh] overflow-y-auto"
          >
            {/* Dock Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-teal-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                  Demo Stage Tools
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                title="Collapse dock"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Section: Happy Path Simulations */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-teal-400/70 px-1">Happy Path</span>

              {/* Simulate Morning Call */}
              <button
                onClick={() => triggerSimulateMorningCall()}
                className="w-full px-3 py-2 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 hover:text-emerald-100 border border-emerald-700/50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <PhoneCall className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-white">Simulate Morning Call</div>
                  <div className="text-[10px] text-emerald-300/80">Logs 42s Hindi call & moves to Done</div>
                </div>
              </button>

              {/* Simulate Missed Call */}
              <button
                onClick={() => triggerSimulateMissedCall()}
                className="w-full px-3 py-2 bg-amber-950/70 hover:bg-amber-900 text-amber-200 hover:text-amber-100 border border-amber-700/50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <PhoneMissed className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-white">Simulate Missed Call</div>
                  <div className="text-[10px] text-amber-300/80">Flags 2 unanswered attempts</div>
                </div>
              </button>

              {/* Simulate Distress Alert */}
              <button
                onClick={() => triggerSimulateDistressAlert()}
                className="w-full px-3 py-2 bg-rose-950/90 hover:bg-rose-900 text-rose-200 hover:text-rose-100 border border-rose-600/70 rounded-lg text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <AlertOctagon className="w-3.5 h-3.5 text-rose-400 shrink-0 animate-pulse" />
                <div className="text-left">
                  <div className="font-semibold text-white">Simulate Distress Alert</div>
                  <div className="text-[10px] text-rose-300/80">"Chakkar aa raha hai" red banner</div>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/80 my-0.5" />

            {/* Section: Guardrail Tests (Phase 3) */}
            <div className="flex flex-col gap-2">
              <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400/70 px-1">Guardrail Tests</span>

              {/* Task 3.1t: Guardrail Test - Unapproved Payment Blocked */}
              <button
                onClick={() => triggerSimulateUnapprovedPayment()}
                className="w-full px-3 py-2 bg-red-950/60 hover:bg-red-950/90 text-red-200 hover:text-red-100 border border-red-700/50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-white">3.1t: Block Unapproved Pay</div>
                  <div className="text-[10px] text-red-300/80">Attempts ₹1,450 auto-debit → BLOCKED</div>
                </div>
              </button>

              {/* Task 3.2t: Guardrail Test - Dosage Modification Refusal */}
              <button
                onClick={() => triggerSimulateDosageChangeAttempt()}
                className="w-full px-3 py-2 bg-orange-950/60 hover:bg-orange-950/90 text-orange-200 hover:text-orange-100 border border-orange-700/50 rounded-lg text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Pill className="w-3.5 h-3.5 text-orange-400 shrink-0" />
                <div className="text-left">
                  <div className="font-semibold text-white">3.2t: Refuse Dose Alteration</div>
                  <div className="text-[10px] text-orange-300/80">"2 गोली कर दो" → REFUSED</div>
                </div>
              </button>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-800/80 my-0.5" />

            {/* Reset Demo */}
            <button
              onClick={() => triggerResetDemo()}
              className="w-full px-3 py-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 rounded-lg text-xs font-medium flex items-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <div className="text-left">
                <div className="font-semibold text-slate-200">Reset Demo State</div>
                <div className="text-[10px] text-slate-500">Clear all simulated flags & tasks</div>
              </div>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </aside>
  );
};
