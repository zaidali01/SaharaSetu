import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  MapPin, 
  Languages, 
  Activity, 
  Store,
  Zap,
  Flame
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const ParentProfileModal: React.FC = () => {
  const { isParentProfileOpen, setIsParentProfileOpen, activeParent, setActiveParent, parents } = useApp();

  if (!isParentProfileOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
                👴
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">{activeParent.name}</h3>
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-800 text-slate-300 border border-slate-700">
                    Age {activeParent.age} • {activeParent.relation}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-teal-400" />
                  <span>{activeParent.address}, {activeParent.city} ({activeParent.pincode})</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close profile modal"
              onClick={() => setIsParentProfileOpen(false)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-5 text-xs">
            {/* Quick Switcher */}
            <div className="flex items-center justify-between bg-slate-100 p-2 rounded-xl">
              <span className="font-semibold text-slate-700 ml-2">Switch Monitored Parent:</span>
              <div className="flex gap-2">
                {parents.map((parent) => (
                  <button
                    key={parent.id}
                    type="button"
                    onClick={() => setActiveParent(parent)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeParent.id === parent.id
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {parent.name} ({parent.location.split(',')[0]})
                  </button>
                ))}
              </div>
            </div>

            {/* Vitals Summary Card */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-teal-600" />
                  Latest Health Vitals (Recorded via Voice Check-in)
                </span>
                <span className="text-[11px] text-slate-500 font-mono">
                  {activeParent.vitals.lastChecked}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-medium text-slate-500">Blood Pressure</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{activeParent.vitals.bloodPressure}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-medium text-slate-500">Fasting Sugar</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{activeParent.vitals.bloodSugarFasting}</p>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-2xs text-center">
                  <span className="text-[10px] uppercase font-medium text-slate-500">Pulse Rate</span>
                  <p className="text-sm font-bold text-slate-900 mt-0.5">{activeParent.vitals.pulseRate}</p>
                </div>
              </div>
            </div>

            {/* Language & Voice Telephony Config */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
              <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                <Languages className="w-4 h-4 text-indigo-600" />
                Sarvam Voice Agent Localization
              </span>
              <p className="text-slate-600">
                Primary IVR Dialect: <strong>{activeParent.preferredLanguage}</strong> with native colloquial fluency in <strong>{activeParent.secondaryLanguage}</strong>.
              </p>
              <div className="flex gap-2 pt-1 flex-wrap">
                {activeParent.dialects.map((d, i) => (
                  <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-800 text-[11px] font-semibold rounded border border-indigo-200">
                    {d} Acoustic Model v2
                  </span>
                ))}
              </div>
            </div>

            {/* Local Vendor Bindings */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                Grounded Local Vendor Registry
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Chemist */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-teal-700 font-semibold">
                    <Store className="w-3.5 h-3.5" />
                    <span>Pharmacy</span>
                  </div>
                  <p className="font-medium text-slate-900">{activeParent.vendors.chemist.name}</p>
                  <p className="text-slate-500 text-[11px]">{activeParent.vendors.chemist.area}</p>
                  <p className="text-slate-600 font-mono text-[10px]">{activeParent.vendors.chemist.phone}</p>
                </div>

                {/* LPG */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
                    <Flame className="w-3.5 h-3.5" />
                    <span>LPG Gas</span>
                  </div>
                  <p className="font-medium text-slate-900">{activeParent.vendors.lpg.provider}</p>
                  <p className="text-slate-500 text-[11px]">{activeParent.vendors.lpg.agency}</p>
                  <p className="text-slate-600 font-mono text-[10px]">Ref: {activeParent.vendors.lpg.consumerNo}</p>
                </div>

                {/* Electricity */}
                <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1">
                  <div className="flex items-center gap-1.5 text-indigo-700 font-semibold">
                    <Zap className="w-3.5 h-3.5" />
                    <span>Electricity (BBPS)</span>
                  </div>
                  <p className="font-medium text-slate-900">{activeParent.vendors.electricity.provider}</p>
                  <p className="text-slate-500 text-[11px]">Auto-Mandate active</p>
                  <p className="text-slate-600 font-mono text-[10px]">ID: {activeParent.vendors.electricity.consumerId}</p>
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-2">
              <span className="font-semibold text-slate-900 uppercase tracking-wider text-[11px]">
                Emergency Escalation Tree
              </span>
              <div className="space-y-2">
                {activeParent.emergencyContacts.map((contact, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-slate-900">{contact.name}</span>
                      <span className="text-slate-500 ml-2 font-normal">({contact.relation} • {contact.location})</span>
                    </div>
                    <span className="font-mono text-slate-700 font-medium">{contact.phone}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
            <button
              type="button"
              onClick={() => setIsParentProfileOpen(false)}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded-lg cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
