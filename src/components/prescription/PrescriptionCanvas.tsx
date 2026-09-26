import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  ZoomIn, 
  CheckCircle2
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const PrescriptionCanvas: React.FC = () => {
  const { prescriptionItems, selectedRxId, setSelectedRxId, activeParent } = useApp();
  const [hoveredRxId, setHoveredRxId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  return (
    <div className="space-y-3">
      {/* Canvas Controls Bar */}
      <div className="flex items-center justify-between bg-slate-100 p-2.5 rounded-xl border border-slate-200 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-slate-800">Prescription Scan Preview</span>
          <span className="text-slate-600 font-mono text-[11px]">(rx_skverma_patna_2026.pdf)</span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-teal-800 bg-teal-100 px-2 py-0.5 rounded font-medium">
            OCR Bounding Boxes: 4 Detected
          </span>
          <button
            onClick={() => setZoomLevel(prev => prev === 1 ? 1.05 : 1)}
            className="p-1 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200 transition-colors cursor-pointer"
            title="Toggle zoom"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Realistic Doctor Rx Pad */}
      <div className="relative w-full bg-[#fcfbf7] border-2 border-slate-300 rounded-xl shadow-lg p-6 sm:p-8 overflow-hidden font-serif select-none transition-all duration-200"
        style={{ transform: `scale(${zoomLevel})`, transformOrigin: 'top center' }}
      >
        {/* Subtle Paper Texture & Watermark */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="absolute right-10 top-24 opacity-5 pointer-events-none text-teal-900 font-sans font-black text-7xl rotate-[-25deg]">
          VERMA CLINIC
        </div>

        {/* Doctor Header */}
        <div className="border-b-2 border-slate-800/80 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-slate-900 font-sans tracking-tight">
                Dr. S. K. Verma
              </span>
              <span className="text-xs font-semibold text-slate-600 font-sans">
                M.D. (Medicine), F.I.C.P.
              </span>
            </div>
            <p className="text-xs text-slate-600 font-sans mt-0.5">
              Consultant Physician & Cardiologist • Senior Ex-Consultant PMCH Patna
            </p>
            <p className="text-[11px] text-slate-500 font-sans">
              Regn No: <strong>BCMR / 2004 / 4891</strong> • Patna, Bihar
            </p>
          </div>

          <div className="text-right font-sans">
            <span className="text-xs font-bold text-teal-800 block">VERMA HEART & DIABETES CARE</span>
            <p className="text-[10px] text-slate-500">Exhibition Road Chauraha, Patna - 800001</p>
            <p className="text-[10px] text-slate-500">Ph: +91 94311 22334 / 0612-230918</p>
          </div>
        </div>

        {/* Patient Details Row */}
        <div className="py-3 border-b border-slate-300 grid grid-cols-2 sm:grid-cols-4 gap-2 font-sans text-xs">
          <div>
            <span className="text-slate-500 text-[10px]">Patient Name:</span>
            <p className="font-bold text-slate-800">{activeParent.name}</p>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Age / Gender:</span>
            <p className="font-bold text-slate-800">{activeParent.age} Yrs / Male</p>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">Date of Consult:</span>
            <p className="font-bold text-slate-800">24-Sep-2026</p>
          </div>
          <div>
            <span className="text-slate-500 text-[10px]">BP / Fasting:</span>
            <p className="font-bold text-teal-800">128/82 • 114 mg/dL</p>
          </div>
        </div>

        {/* Rx Symbol */}
        <div className="pt-4 pb-2 flex items-center justify-between">
          <span className="text-3xl font-serif font-black text-slate-900 tracking-tighter">
            ℞
          </span>
          <span className="text-[11px] text-slate-400 font-sans italic">
            (Advised Regular Medication Schedule)
          </span>
        </div>

        {/* Prescription Lines with OCR Bounding Box Overlays */}
        <div className="relative space-y-4 py-2 font-sans min-h-[300px]">
          {prescriptionItems.map((item, idx) => {
            const isSelected = selectedRxId === item.id;
            const isHovered = hoveredRxId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setSelectedRxId(item.id)}
                onMouseEnter={() => setHoveredRxId(item.id)}
                onMouseLeave={() => setHoveredRxId(null)}
                className={`relative p-3 rounded-lg border-2 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-teal-600 bg-teal-50/60 shadow-md ring-2 ring-teal-500/20'
                    : isHovered
                    ? 'border-teal-400 bg-teal-50/30'
                    : 'border-dashed border-teal-500/40 bg-white/70 hover:border-teal-500'
                }`}
              >
                {/* Simulated OCR Tag Badge */}
                <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-teal-700 text-white flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>OCR: {(item.confidence * 100).toFixed(0)}% Conf.</span>
                </div>

                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-black text-slate-900 font-mono">
                        {idx + 1}. {item.rawOcrText}
                      </span>
                    </div>

                    <p className="text-xs text-slate-700 mt-1 font-sans">
                      <strong>Schedule:</strong> {item.frequency} — {item.instruction}
                    </p>
                  </div>

                  <span className="text-xs font-mono font-bold text-teal-800 bg-teal-100 px-2 py-1 rounded">
                    {item.frequencyCode}
                  </span>
                </div>

                {isSelected && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-2 pt-2 border-t border-teal-200 text-[11px] text-teal-900 flex items-center justify-between"
                  >
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                      Active schedule slot: <strong>{item.nextTriggerTime}</strong>
                    </span>
                    <span className="font-semibold text-teal-700">Click to inspect table</span>
                  </motion.div>
                )}
              </div>
            );
          })}
        </div>

        {/* Doctor Signature & Stamp Area */}
        <div className="pt-8 mt-6 border-t border-slate-300 flex items-end justify-between font-sans">
          <div className="text-[10px] text-slate-400">
            <p>Note: Take medicines after meals with plain water.</p>
            <p>Next review after 30 days with Lipid & Sugar reports.</p>
          </div>

          <div className="text-center">
            <div className="font-serif italic text-lg text-teal-950 font-bold -rotate-3 select-none">
              Dr. S.K. Verma
            </div>
            <div className="w-32 h-0.5 bg-slate-400 mx-auto my-1" />
            <p className="text-[10px] font-bold text-slate-700 uppercase">Authorized Signature & Stamp</p>
          </div>
        </div>

      </div>
    </div>
  );
};
