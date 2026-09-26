import React from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  ChevronDown, 
  Layers, 
  FileText, 
  Cpu
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Navbar: React.FC = () => {
  const { 
    activeTab, 
    setActiveTab, 
    activeParent, 
    setIsGuardrailsOpen, 
    setIsAlertsDrawerOpen, 
    setIsParentProfileOpen, 
    criticalFlags,
    backendStatus,
    refreshFromBackend 
  } = useApp();

  const unresolvedFlags = criticalFlags.filter((f) => !f.resolved);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 w-full py-3">
        <div className="flex items-center justify-between gap-4">
          
          {/* Brand & Live Gateway Radar */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-base shadow-sm">
                सह
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-semibold text-slate-900 tracking-tight flex items-center gap-1.5">
                    Sahay AI <span className="text-slate-500 font-normal text-sm">(सहाय)</span>
                  </h1>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 radar-live" />
                  <span className="font-medium text-emerald-700">Voice & WhatsApp Gateway: Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Active Parent Selector & Profile Button */}
          <div className="hidden md:flex items-center">
            <button
              onClick={() => setIsParentProfileOpen(true)}
              className="flex items-center gap-2.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200/90 rounded-xl text-left transition-all cursor-pointer group shadow-2xs active:scale-[0.98]"
            >
              <div className="w-6 h-6 rounded-lg bg-slate-200/80 text-slate-800 flex items-center justify-center text-xs">
                👴
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-slate-800 flex items-center gap-1">
                  {activeParent.name}
                  <span className="text-[10px] font-normal text-slate-500">({activeParent.relationship})</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {activeParent.address.split(',')[0]}, Patna • Lang: {activeParent.preferredLanguage.split('/')[0]}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700 ml-0.5 transition-transform group-hover:translate-y-0.5" />
            </button>
          </div>

          {/* Right Action Badges: Guaranteed safe right margin (pr-2 sm:pr-4) to prevent any screen edge clipping */}
          <div className="flex items-center gap-2.5 pr-2 sm:pr-4">
            
            {/* Backend Connectivity Status (Task 2.6i) */}
            <button
              onClick={() => refreshFromBackend()}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                backendStatus === 'connected'
                  ? 'bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200'
                  : 'bg-amber-50/80 hover:bg-amber-100/80 text-amber-800 border border-amber-200'
              }`}
              title="Click to manually refresh from Track C Backend & Database"
            >
              <span className={`w-2 h-2 rounded-full ${backendStatus === 'connected' ? 'bg-emerald-500 radar-live' : 'bg-amber-500'}`} />
              <span className="hidden sm:inline">Track C: {backendStatus === 'connected' ? 'Live (Port 4000)' : 'Offline Grounded'}</span>
              <span className="sm:hidden">{backendStatus === 'connected' ? 'Live' : 'Mock'}</span>
            </button>

            {/* Guardrails Verification Badge */}
            <button
              onClick={() => setIsGuardrailsOpen(true)}
              className="px-3 py-1.5 bg-emerald-50/80 hover:bg-emerald-100/80 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98]"
              title="Click to view verified autonomous guardrails"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="hidden sm:inline">Guardrails Active</span>
              <span className="sm:hidden">Safe</span>
              <span className="px-1.5 py-0.2 bg-emerald-200/70 text-emerald-900 rounded text-[10px] font-mono font-semibold">
                100%
              </span>
            </button>

            {/* Persistent Alert Chip (Task 4.5) */}
            <button
              onClick={() => setIsAlertsDrawerOpen(true)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer active:scale-[0.98] ${
                unresolvedFlags.length > 0
                  ? 'bg-rose-50/90 hover:bg-rose-100/90 text-rose-800 border border-rose-200'
                  : 'bg-slate-100 text-slate-600 border border-slate-200'
              }`}
            >
              <AlertTriangle className={`w-3.5 h-3.5 ${unresolvedFlags.length > 0 ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
              <span>{unresolvedFlags.length} Critical Alert{unresolvedFlags.length === 1 ? '' : 's'}</span>
            </button>
          </div>

        </div>

        {/* Mobile Parent Indicator */}
        <div className="md:hidden pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => setIsParentProfileOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-slate-800 text-left cursor-pointer"
          >
            <span>👴 {activeParent.name} — Patna ({activeParent.preferredLanguage})</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>

        {/* Segmented Pill Navigation Bar */}
        <nav aria-label="Main Navigation" className="flex items-center space-x-2 border-t border-slate-100 pt-3 mt-3 overflow-x-auto">
          {/* Tab 1: Command Board */}
          <button
            onClick={() => setActiveTab('command_board')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'command_board'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Command Board & Payments</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              activeTab === 'command_board' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
            }`}>
              Tasks 4.3–4.5
            </span>
            <kbd className={`hidden sm:inline-block text-[9px] font-mono px-1 rounded ${
              activeTab === 'command_board' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'
            }`}>
              1
            </kbd>
          </button>

          {/* Tab 2: Document Intake & OCR */}
          <button
            onClick={() => setActiveTab('document_intake')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'document_intake'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Document Intake & OCR</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              activeTab === 'document_intake' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
            }`}>
              Tasks 4.1–4.2
            </span>
            <kbd className={`hidden sm:inline-block text-[9px] font-mono px-1 rounded ${
              activeTab === 'document_intake' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'
            }`}>
              2
            </kbd>
          </button>

          {/* Tab 3: Agent Pipeline Trace */}
          <button
            onClick={() => setActiveTab('agent_trace')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
              activeTab === 'agent_trace'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Pipeline Trace</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              activeTab === 'agent_trace' ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-600'
            }`}>
              Task 4.6
            </span>
            <kbd className={`hidden sm:inline-block text-[9px] font-mono px-1 rounded ${
              activeTab === 'agent_trace' ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-500'
            }`}>
              3
            </kbd>
          </button>
        </nav>

      </div>
    </header>
  );
};
