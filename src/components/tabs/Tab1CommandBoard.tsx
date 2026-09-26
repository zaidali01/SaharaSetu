import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  Check, 
  MessageSquare, 
  Zap, 
  Pill, 
  PhoneCall, 
  ShoppingBag, 
  PhoneForwarded, 
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle,
  FileSearch,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Tab1CommandBoard: React.FC = () => {
  const { 
    tasks, 
    approveTask, 
    rejectTask, 
    setActiveTranscriptTask, 
    setActiveWhatsAppTask, 
    setActiveChemistModalTask,
    setActiveAuditTask,
    activeParent,
    backendStatus,
    refreshFromBackend
  } = useApp();

  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const filteredTasks = tasks.filter(t => {
    if (categoryFilter === 'all') return true;
    return t.category === categoryFilter;
  });

  const doneTasks = filteredTasks.filter((t) => t.column === 'done');
  const needsApprovalTasks = filteredTasks.filter((t) => t.column === 'needs_approval');
  const blockedTasks = filteredTasks.filter((t) => t.column === 'blocked');

  // Stats calculation
  const pendingFunds = needsApprovalTasks.reduce((acc, t) => acc + (t.amount || 0), 0);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'medication':
        return <Pill className="w-3.5 h-3.5 text-teal-600" />;
      case 'utility':
        return <Zap className="w-3.5 h-3.5 text-amber-600" />;
      case 'chemist':
        return <ShoppingBag className="w-3.5 h-3.5 text-indigo-600" />;
      case 'checkin':
        return <PhoneCall className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Layer 2 Surface: Crisp White Segmented KPI Stat Banner */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-4 mb-6 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-200">
        
        {/* Stat 1 */}
        <div className="p-2 sm:px-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Operations Done Today
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-semibold text-slate-900">{doneTasks.length} Completed</span>
              <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60">
                +1 confirmed {activeParent.language.split('/')[0]}
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 2 */}
        <div className="p-2 sm:px-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Awaiting Sign-off (Financial Gate)
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-semibold text-slate-900 font-mono">
                ₹{pendingFunds > 0 ? pendingFunds.toFixed(2) : '1,252.00'}
              </span>
              <span className="text-xs text-slate-500">
                ({needsApprovalTasks.length} Tasks in queue)
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
        </div>

        {/* Stat 3 */}
        <div className="p-2 sm:px-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider block">
              Next Scheduled Check-in
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-base font-semibold text-slate-900">
                {activeParent.name.split(' ')[0]} • 8:00 PM Dinner Call
              </span>
              <span className="text-xs font-medium text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-200/60">
                Sarvam IVR
              </span>
            </div>
          </div>
          <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200/70 text-indigo-700 flex items-center justify-center shrink-0">
            <Activity className="w-4 h-4" />
          </div>
        </div>

      </div>

      {/* Filter Chips Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: 'All Tasks' },
            { id: 'medication', label: 'Medications' },
            { id: 'chemist', label: 'Chemist Dispatches' },
            { id: 'utility', label: 'Utilities & Bills' },
            { id: 'checkin', label: 'Voice Calls' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refreshFromBackend()}
            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
            title="Poll Track C task queue and telemetry log"
          >
            <RefreshCw className="w-3 h-3 text-slate-500" />
            <span>Sync Tasks ({backendStatus === 'connected' ? 'Live' : 'Cached'})</span>
          </button>
          <span className="text-xs text-slate-500 font-medium">
            Showing {filteredTasks.length} active items for {activeParent.name} ({activeParent.location.split(',')[0]})
          </span>
        </div>
      </div>

      {/* Tri-Column Kanban Grid: Layer 1 (Column Wells) -> Layer 2 (Pure Crisp White Cards) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* =========================================================================
            COLUMN 1: DONE & VERIFIED (Layer 1 Well)
        ========================================================================= */}
        <div className="bg-slate-200/60 border border-slate-300/60 rounded-2xl p-4 min-h-[640px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">
                Done & Verified
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-emerald-800 bg-emerald-100 border border-emerald-200">
              {doneTasks.length}
            </span>
          </div>

          {/* Cards List: Layer 2 Surface */}
          <div className="space-y-3">
            <AnimatePresence>
              {doneTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 cursor-grab space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1 rounded-md bg-slate-50 border border-slate-200 shrink-0">
                        {getCategoryIcon(task.category)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 leading-snug">
                          {task.title}
                        </h4>
                        {task.subtitle && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                            {task.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded text-emerald-800 bg-emerald-50 border border-emerald-200 shrink-0 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      {task.badgeText || 'Done'}
                    </span>
                  </div>

                  {/* Clean Verification Snippet with Light Slate Border */}
                  {task.verificationMethod && (
                    <div className="border border-slate-200 bg-slate-50/70 rounded-lg p-2.5 text-xs text-slate-700 flex items-center justify-between">
                      <span className="truncate pr-1 font-medium">{task.verificationMethod}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">{task.time}</span>
                    </div>
                  )}

                  {/* Amount if utility */}
                  {task.amount && (
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <span className="text-slate-500">Auto-Mandate BBPS:</span>
                      <span className="font-mono font-semibold text-slate-900">₹{task.amount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Listen Transcript CTA if voice verified */}
                  {task.transcript && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-slate-500 font-mono">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{task.transcript.duration} min IVR</span>
                      </div>

                      <button
                        onClick={() => setActiveTranscriptTask(task)}
                        className="rounded-lg text-xs font-medium px-3 py-2 bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                      >
                        <Play className="w-3 h-3 fill-slate-800 text-slate-800" />
                        <span>Listen Transcript</span>
                      </button>
                    </div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>


        {/* =========================================================================
            COLUMN 2: NEEDS YOUR APPROVAL (Layer 1 Well)
        ========================================================================= */}
        <div className="bg-slate-200/60 border border-slate-300/60 rounded-2xl p-4 min-h-[640px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">
                Needs Your Approval
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-amber-800 bg-amber-100 border border-amber-200">
              {needsApprovalTasks.length} Pending
            </span>
          </div>

          {/* Cards List: Layer 2 Surface */}
          <div className="space-y-3">
            <AnimatePresence>
              {needsApprovalTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 cursor-grab space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1 rounded-md bg-slate-50 border border-slate-200 shrink-0">
                        {getCategoryIcon(task.category)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 leading-snug">
                          {task.title}
                        </h4>
                        {task.subtitle && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                            {task.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded text-amber-800 bg-amber-50 border border-amber-200 shrink-0">
                      {task.badgeText || 'Sign-off Required'}
                    </span>
                  </div>

                  {/* Clean Amount Details Box */}
                  {task.amount && (
                    <div className="border border-slate-200 bg-slate-50/70 rounded-lg p-2.5 flex items-center justify-between text-xs">
                      <span className="text-slate-500 font-medium">Order Amount:</span>
                      <span className="font-mono font-semibold text-sm text-slate-900">₹{task.amount.toFixed(2)}</span>
                    </div>
                  )}

                  {/* Chemist WhatsApp preview popover button & Audit Trace Link */}
                  {task.whatsappDraft && (
                    <div className="flex items-center justify-between pt-0.5">
                      <button
                        onClick={() => setActiveWhatsAppTask(task)}
                        className="text-xs text-slate-800 hover:text-slate-950 font-medium flex items-center gap-1.5 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Preview Drafted WhatsApp</span>
                        <ChevronRight className="w-3 h-3 text-slate-400" />
                      </button>

                      <button
                        onClick={() => setActiveAuditTask(task)}
                        className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
                        title="View OCR confidence & guardrail audit trace"
                      >
                        <FileSearch className="w-3 h-3 text-slate-400" />
                        <span>Audit Trace</span>
                      </button>
                    </div>
                  )}

                  {/* LPG Cylinder Details with Clean Slate Border */}
                  {task.bookingDetails && (
                    <div className="text-xs text-slate-600 space-y-1 bg-slate-50/70 p-2.5 rounded-lg border border-slate-200">
                      <div className="flex justify-between">
                        <span>Consumer ID:</span>
                        <span className="font-mono font-semibold text-slate-800">{task.bookingDetails.consumerNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Schedule Due:</span>
                        <span className="font-medium text-amber-800">{task.bookingDetails.dueDate}</span>
                      </div>
                    </div>
                  )}

                  {/* Standardized Action Buttons: Solid dark slate button for Approve */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    <button
                      onClick={() => rejectTask(task.id)}
                      className="rounded-lg text-xs font-medium px-3 py-2 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      Reject / Edit
                    </button>

                    <button
                      onClick={() => approveTask(task.id)}
                      className="rounded-lg text-xs font-medium px-3 py-2 text-white bg-slate-900 hover:bg-slate-800 flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{task.category === 'chemist' ? 'Approve & Dispatch' : 'Approve Booking'}</span>
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {needsApprovalTasks.length === 0 && (
              <div className="text-center py-12 bg-white/60 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                ✨ Approval queue is clear! All dispatches authorized.
              </div>
            )}
          </div>
        </div>


        {/* =========================================================================
            COLUMN 3: COULDN'T COMPLETE / BLOCKERS (Layer 1 Well)
        ========================================================================= */}
        <div className="bg-slate-200/60 border border-slate-300/60 rounded-2xl p-4 min-h-[640px] space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <h3 className="font-semibold text-xs text-slate-900 tracking-tight uppercase">
                Couldn't Complete / Blockers
              </h3>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-md text-rose-800 bg-rose-100 border border-rose-200">
              {blockedTasks.length} Issues
            </span>
          </div>

          {/* Cards List: Layer 2 Surface */}
          <div className="space-y-3">
            <AnimatePresence>
              {blockedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-xl p-4 border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-150 cursor-grab space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5">
                      <div className="mt-0.5 p-1 rounded-md bg-slate-50 border border-slate-200 shrink-0">
                        {getCategoryIcon(task.category)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-slate-900 leading-snug">
                          {task.title}
                        </h4>
                        {task.subtitle && (
                          <p className="text-xs text-slate-500 mt-0.5 leading-normal">
                            {task.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-medium px-2 py-0.5 rounded text-rose-800 bg-rose-50 border border-rose-200 shrink-0">
                      {task.badgeText || 'Action Blocked'}
                    </span>
                  </div>

                  {/* Clean Blocker Reason Box */}
                  {task.blockerDetails && (
                    <div className="border border-slate-200 bg-slate-50/70 rounded-lg p-2.5 text-xs text-slate-700 space-y-1">
                      <p className="leading-relaxed">
                        {task.blockerDetails.reason}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-200">
                        <span>Attempts: {task.blockerDetails.attempts}</span>
                        <span>{task.blockerDetails.lastAttemptTime}</span>
                      </div>
                    </div>
                  )}

                  {/* Standardized Action CTAs */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                    {task.category === 'chemist' && (
                      <button
                        onClick={() => setActiveChemistModalTask(task)}
                        className="w-full rounded-lg text-xs font-medium px-3 py-2 bg-slate-900 hover:bg-slate-800 text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-[0.98]"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Find Alternate Chemist</span>
                      </button>
                    )}

                    {task.category === 'checkin' && (
                      <button
                        onClick={() => {
                          setActiveAuditTask(task);
                        }}
                        className="w-full rounded-lg text-xs font-medium px-3 py-2 bg-rose-700 hover:bg-rose-600 text-white flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-[0.98]"
                      >
                        <PhoneForwarded className="w-3.5 h-3.5" />
                        <span>Trigger Emergency Ping</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {blockedTasks.length === 0 && (
              <div className="text-center py-12 bg-white/60 rounded-xl border border-dashed border-slate-300 text-xs text-slate-400">
                🎉 No active blockers!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
