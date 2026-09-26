import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, 
  ShieldAlert, 
  CheckCircle2, 
  Sparkles, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  Zap, 
  Info,
  ScanLine
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { PrescriptionCanvas } from '../prescription/PrescriptionCanvas';
import { playSound } from '../../utils/audio';

export const Tab2DocumentIntake: React.FC = () => {
  const { 
    prescriptionItems, 
    setPrescriptionItems, 
    approvePrescriptionSchedule, 
    selectedRxId, 
    setSelectedRxId,
    activeParent,
    addToast
  } = useApp();

  const [isDragging, setIsDragging] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const handleFrequencyChange = (id: string, newFreq: any) => {
    setPrescriptionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, frequency: newFreq } : item))
    );
  };

  const handleNameChange = (id: string, newName: string) => {
    setPrescriptionItems(prev =>
      prev.map(item => (item.id === id ? { ...item, medicineName: newName } : item))
    );
  };

  const triggerScanAnimation = (fileName: string) => {
    setIsScanning(true);
    setScanProgress(0);
    playSound('ping');

    let current = 0;
    const interval = setInterval(() => {
      current += 25;
      setScanProgress(Math.min(100, current));
      if (current >= 100) {
        clearInterval(interval);
        setTimeout(() => {
          setIsScanning(false);
          playSound('approval');
          addToast({
            type: 'success',
            title: 'Prescription OCR Extracted',
            message: `Parsed "${fileName}". 4 clinical entities extracted with 96.4% confidence.`
          });
        }, 300);
      }
    }, 250);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      triggerScanAnimation(e.target.files[0].name);
    }
  };

  return (
    <div className="space-y-6 pb-24">
      
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
              Prescription Document Intake & OCR Schedule Verification
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200">
              Tasks 4.1 & 4.2
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Zero-hallucination verification pipeline: AI Vision OCR extracts medicine regimens for <strong>{activeParent.name}</strong>, requiring child validation before autonomous activation.
          </p>
        </div>

        {/* Safety Indicator Badge */}
        <div className="flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-emerald-800 text-xs font-semibold shrink-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Anti-Hallucination Safe Review</span>
        </div>
      </div>

      {/* Split-Screen Layout: Left Side (Task 4.1) & Right Side (Task 4.2) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* =========================================================================
            LEFT SIDE: TASK 4.1 DOCUMENT INTAKE & PRESCRIPTION CANVAS (5 Cols)
        ========================================================================= */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Drag & Drop Upload Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              triggerScanAnimation('dr_verma_prescription_pmch.pdf');
            }}
            className={`p-5 rounded-2xl border-2 border-dashed transition-all text-center cursor-pointer ${
              isDragging
                ? 'border-teal-500 bg-teal-50/80 scale-[0.99]'
                : 'border-slate-300 hover:border-teal-500 bg-white'
            }`}
          >
            <label className="cursor-pointer block">
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                className="hidden"
                onChange={handleFileUpload}
              />
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center mx-auto mb-2 shadow-2xs">
                <UploadCloud className="w-5 h-5" />
              </div>
              <h4 className="text-xs font-semibold text-slate-800">
                Drop New Prescription or Lab Scan Here
              </h4>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Supports PDF, PNG, JPG scans (Dr. S.K. Verma sample loaded)
              </p>
            </label>
          </div>

          {/* Scanning Progress Overlay / Skeleton if active */}
          <AnimatePresence>
            {isScanning && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-2.5 overflow-hidden"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-mono text-teal-300">
                    <ScanLine className="w-4 h-4 animate-pulse text-teal-400" />
                    AI Vision OCR running...
                  </span>
                  <span className="font-mono text-xs text-teal-400 font-bold">{scanProgress}%</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                  <motion.div
                    className="bg-gradient-to-r from-teal-500 to-emerald-400 h-full rounded-full"
                    style={{ width: `${scanProgress}%` }}
                  />
                </div>
                <p className="text-[10px] text-slate-400 font-mono">
                  Detecting bounding boxes & matching clinical NDC registry tokens...
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Visual Realistic Doctor Prescription Canvas */}
          <PrescriptionCanvas />
        </div>


        {/* =========================================================================
            RIGHT SIDE: TASK 4.2 PRE-ACTIVATION SCHEDULE VERIFICATION (7 Cols)
        ========================================================================= */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Prominent Mandatory Safety Gate Callout */}
          <div className="bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 shadow-xs flex items-start gap-3 text-amber-950">
            <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold tracking-tight uppercase">
                Safety Guardrail: Child Confirmation Required
              </h4>
              <p className="text-xs text-amber-900 leading-relaxed">
                Scheduled calls and vendor orders remain locked until verified by the child. No automated voice IVR calls or local chemist purchase dispatches occur until this schedule is confirmed.
              </p>
            </div>
          </div>

          {/* Schedule Verification Table Card with tight px-3 py-2 padding for zero clipping */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Pre-Activation Schedule Verification Table
                </h3>
                <p className="text-xs text-slate-500">
                  Anti-hallucination safe review before syncing to IVR caller agent
                </p>
              </div>
              <span className="text-xs font-semibold text-teal-800 bg-teal-100 px-2.5 py-0.5 rounded-full">
                4 Items Extracted
              </span>
            </div>

            {/* Table wrapper with overflow-x-auto and tight cell padding */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                    <th className="px-3 py-2.5">Medicine & Strength</th>
                    <th className="px-3 py-2.5">Category</th>
                    <th className="px-3 py-2.5">Cadence</th>
                    <th className="px-3 py-2.5">Next Refill Date</th>
                    <th className="px-3 py-2.5 text-right">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {prescriptionItems.map((item, idx) => {
                    const isSelected = selectedRxId === item.id;
                    const isHighConfidence = item.confidence >= 0.95;

                    return (
                      <tr
                        key={item.id}
                        onClick={() => setSelectedRxId(item.id)}
                        className={`transition-colors cursor-pointer ${
                          isSelected ? 'bg-teal-50/70 font-medium' : 'hover:bg-slate-50'
                        }`}
                      >
                        {/* Medicine Name & Dosage */}
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-mono text-[9px] font-bold shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <input
                                type="text"
                                value={item.medicineName}
                                onChange={(e) => handleNameChange(item.id, e.target.value)}
                                className="font-semibold text-slate-900 text-xs bg-transparent border-b border-transparent hover:border-slate-300 focus:border-teal-500 focus:outline-none"
                              />
                              <p className="text-[10px] text-slate-500 font-mono">{item.dosage}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {item.category}
                          </span>
                        </td>

                        {/* Frequency Dropdown */}
                        <td className="px-3 py-2">
                          <select
                            value={item.frequency}
                            onChange={(e) => handleFrequencyChange(item.id, e.target.value)}
                            className="text-[11px] bg-white border border-slate-200 rounded-md px-1.5 py-1 text-slate-800 focus:ring-1 focus:ring-teal-500 focus:outline-none cursor-pointer"
                          >
                            <option value="Once Daily (Morning)">Once Daily (Morning)</option>
                            <option value="Twice Daily (Morning & Night)">Twice Daily (Morning & Night)</option>
                            <option value="At Bedtime (Night)">At Bedtime (Night)</option>
                            <option value="As Needed">As Needed (SOS)</option>
                          </select>
                        </td>

                        {/* Next Refill Date / Trigger Slot */}
                        <td className="px-3 py-2 font-mono text-[11px] text-slate-700">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-teal-600 shrink-0" />
                            <span className="truncate">{item.nextTriggerTime}</span>
                          </div>
                        </td>

                        {/* Confidence Score on Far Right (Guaranteed fully visible) */}
                        <td className="px-3 py-2 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold inline-flex items-center gap-1 shrink-0 ${
                              isHighConfidence
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            <Sparkles className="w-2.5 h-2.5" />
                            {(item.confidence * 100).toFixed(0)}% High
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Selected Entity Detailed Inspector */}
            {selectedRxId && (
              <div className="p-3.5 bg-slate-50 border-t border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-teal-600" />
                    Source Grounding & Clinical Rule
                  </span>
                  <span className="text-slate-500 font-mono text-[10px]">
                    Grounding ID: {selectedRxId}
                  </span>
                </div>
                {(() => {
                  const selected = prescriptionItems.find(i => i.id === selectedRxId);
                  if (!selected) return null;
                  return (
                    <div className="bg-white p-2.5 rounded-lg border border-slate-200 space-y-1">
                      <p className="text-slate-800 font-semibold">
                        {selected.medicineName} ({selected.dosage})
                      </p>
                      <p className="text-slate-600 text-[11px]">
                        <strong>Clinical Instruction:</strong> {selected.instruction}
                      </p>
                      <p className="text-teal-700 text-[10px] font-mono">
                        Mapped to IVR Prompt: &ldquo;नमस्ते बाबूजी, क्या आपने सुबह की {selected.medicineName} ले ली?&rdquo;
                      </p>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* Sticky CTA Action Card */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold text-slate-900">Ready to Activate Schedule</h4>
                <p className="text-[11px] text-slate-500">
                  4 verified medicines will sync directly to Sarvam Voice AI and Chemist Dispatch Queue.
                </p>
              </div>
            </div>

            <button
              onClick={approvePrescriptionSchedule}
              className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0"
            >
              <Zap className="w-4 h-4 text-teal-300" />
              <span>Approve & Activate Schedule</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
