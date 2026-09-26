import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Send, 
  Check, 
  Copy, 
  ShieldCheck, 
  Store, 
  MapPin, 
  CheckCheck,
  ShoppingBag
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const WhatsAppPreviewModal: React.FC = () => {
  const { activeWhatsAppTask, setActiveWhatsAppTask, approveTask } = useApp();
  const [copied, setCopied] = useState(false);
  const [activeLang, setActiveLang] = useState<'hindi' | 'english'>('hindi');

  if (!activeWhatsAppTask || !activeWhatsAppTask.whatsappDraft) return null;

  const draft = activeWhatsAppTask.whatsappDraft;

  const handleCopy = () => {
    const text = activeLang === 'hindi' ? draft.messageHindi : draft.messageEnglish;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = () => {
    const taskId = activeWhatsAppTask.id;
    setActiveWhatsAppTask(null);
    approveTask(taskId);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* WhatsApp Header */}
          <div className="px-6 py-4 bg-[#075e54] text-white flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight">{draft.shopName}</h3>
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-medium bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                    Verified Partner
                  </span>
                </div>
                <p className="text-xs text-emerald-100 flex items-center gap-1 mt-0.5">
                  <span>{draft.recipientPhone}</span>
                  <span>•</span>
                  <span>{draft.recipientName.split(' ')[0]}</span>
                </p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close WhatsApp preview"
              onClick={() => setActiveWhatsAppTask(null)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto space-y-4 bg-[#efeae2]/30">
            {/* Order Items Breakdown */}
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <ShoppingBag className="w-3.5 h-3.5 text-teal-600" />
                  Prescription Refill Payload
                </span>
                <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Total: ₹{activeWhatsAppTask.amount?.toFixed(2)}
                </span>
              </div>

              <div className="space-y-1.5">
                {draft.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs py-0.5">
                    <div>
                      <span className="font-medium text-slate-800">{item.name}</span>
                      <span className="text-slate-500 ml-1.5 font-mono">({item.qty})</span>
                    </div>
                    <span className="font-mono font-medium text-slate-700">₹{item.estimatedPrice.toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-500 flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                <span>Delivery: {draft.deliveryAddress}</span>
              </div>
            </div>

            {/* Language Switcher */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-600">WhatsApp Message Preview:</span>
              <div className="flex items-center bg-slate-200 p-0.5 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setActiveLang('hindi')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activeLang === 'hindi' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Hindi (Vendor)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveLang('english')}
                  className={`px-3 py-1 rounded-md font-medium transition-all cursor-pointer ${
                    activeLang === 'english' ? 'bg-white text-teal-800 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* WhatsApp Chat Bubble Simulation */}
            <div className="bg-[#e7fedb] border border-[#c1e7a9] rounded-2xl rounded-tl-sm p-4 text-slate-800 shadow-2xs relative">
              <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line font-normal">
                {activeLang === 'hindi' ? draft.messageHindi : draft.messageEnglish}
              </p>
              <div className="flex items-center justify-end gap-1 mt-2 text-[10px] text-emerald-800">
                <span>12:15 PM</span>
                <CheckCheck className="w-3.5 h-3.5 text-teal-600" />
              </div>
            </div>

            {/* Guardrail Callout */}
            <div className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 p-3 rounded-xl border border-amber-200">
              <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Safety Gate:</strong> This automated order will NOT be transmitted to WhatsApp until you click &ldquo;Approve &amp; Dispatch&rdquo;.
              </span>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Message'}</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveWhatsAppTask(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApprove}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-1.5 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-emerald-400" />
                <span>Approve & Dispatch (₹{activeWhatsAppTask.amount?.toFixed(2)})</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
