import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  AlertOctagon, 
  PhoneCall, 
  UserCheck, 
  Ambulance, 
  Volume2, 
  X, 
  CheckCircle2, 
  MapPin, 
  HeartHandshake
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const DistressModal: React.FC = () => {
  const { 
    distressAlertModalData, 
    setDistressAlertModalData, 
    activeParent, 
    resolveCriticalFlag,
    addToast 
  } = useApp();

  if (!distressAlertModalData) return null;

  const handleResolve = () => {
    resolveCriticalFlag(distressAlertModalData.id);
    setDistressAlertModalData(null);
  };

  const handleCall = (contactName: string, phone: string) => {
    addToast({
      type: 'info',
      title: `Connecting Call to ${contactName}`,
      message: `Direct VoIP trunk dialed to ${phone}. Emergency bridge active.`
    });
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/80 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          className="bg-white rounded-2xl shadow-2xl border-2 border-rose-500 w-full max-w-xl overflow-hidden flex flex-col"
        >
          {/* Pulsing Emergency Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 text-white flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white animate-pulse">
                <AlertOctagon className="w-7 h-7" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-rose-700 uppercase tracking-widest">
                    CRITICAL DISTRESS FLAG
                  </span>
                  <span className="text-xs text-rose-100 font-mono">
                    {distressAlertModalData.timestamp}
                  </span>
                </div>
                <h3 className="text-lg font-bold tracking-tight text-white mt-0.5">
                  Parent Reported Dizziness ("चक्कर आ रहा है")
                </h3>
              </div>
            </div>

            <button
              onClick={() => setDistressAlertModalData(null)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 bg-rose-50/40">
            {/* Audio Quote Banner */}
            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-xs text-rose-800 font-semibold">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-rose-600 animate-pulse" />
                  Sarvam Indic Voice ASR Snippet (Bhojpuri/Hindi)
                </span>
                <span className="bg-rose-100 text-rose-800 text-[10px] px-2 py-0.5 rounded font-mono">
                  Confidence: 99.2%
                </span>
              </div>
              <p className="text-sm font-semibold text-slate-900 bg-rose-50/60 p-3 rounded-lg border border-rose-100 italic">
                "{distressAlertModalData.audioSnippet || '...तनी चक्कर जइसन बुझाता बाबू, बाकिर अभी बैठल बानी...'}"
              </p>
              <p className="text-xs text-slate-600">
                <strong>English translation:</strong> "Feeling a bit dizzy son, but sitting down for now..."
              </p>
            </div>

            {/* Parent Location & Status Card */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800">{activeParent.name} (Age {activeParent.age})</span>
                <span className="text-slate-500 font-mono">{activeParent.phone}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>{activeParent.address}, {activeParent.city}</span>
              </div>
            </div>

            {/* Quick Action Emergency Grid */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Immediate Escalation Protocols
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleCall(activeParent.name, activeParent.phone)}
                  className="p-3 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-500 rounded-xl flex items-center gap-3 transition-all text-left shadow-sm cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Direct Call Parent</h5>
                    <p className="text-[11px] text-slate-500">Auto-dials {activeParent.phone}</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCall('Manoj Kumar (Neighbor)', '+91 98350 11223')}
                  className="p-3 bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-500 rounded-xl flex items-center gap-3 transition-all text-left shadow-sm cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <HeartHandshake className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Alert Patna Neighbor</h5>
                    <p className="text-[11px] text-slate-500">Manoj Kumar (Next door)</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCall('Dr. S.K. Verma', '+91 94311 22334')}
                  className="p-3 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-500 rounded-xl flex items-center gap-3 transition-all text-left shadow-sm cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-slate-900">Dial Dr. S.K. Verma</h5>
                    <p className="text-[11px] text-slate-500">Family Physician (Patna)</p>
                  </div>
                </button>

                <button
                  onClick={() => handleCall('108 Emergency Ambulance Patna', '108')}
                  className="p-3 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-500 rounded-xl flex items-center gap-3 transition-all text-left shadow-sm cursor-pointer group"
                >
                  <div className="w-9 h-9 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Ambulance className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-rose-900">108 Bihar Ambulance</h5>
                    <p className="text-[11px] text-slate-500">Direct GPS dispatch</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Guardrail Rule #3 active: Distress keyword aborted automated IVR.
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setDistressAlertModalData(null)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                Dismiss Window
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-2 text-xs font-bold text-white bg-emerald-700 hover:bg-emerald-600 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Alert Resolved</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
