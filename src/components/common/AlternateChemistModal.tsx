import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Store, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  Truck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const AlternateChemistModal: React.FC = () => {
  const { activeChemistModalTask, setActiveChemistModalTask, resolveStockBlocker } = useApp();

  const pharmacies = [
    {
      name: 'Apollo Pharmacy — Kankarbagh Colony',
      address: 'Near Old Bypass Road, Patna (1.2 km away)',
      eta: '30-45 mins delivery',
      stockStatus: 'In Stock (Shellcal-D3 60k available)',
      price: '₹210.00',
      tag: 'Fastest Delivery'
    },
    {
      name: 'Patliputra Pharma — Boring Road',
      address: 'Boring Road Chauraha, Patna (3.8 km away)',
      eta: '60 mins delivery',
      stockStatus: 'In Stock (Generic & Branded)',
      price: '₹195.00',
      tag: 'Best Price'
    },
    {
      name: 'Tata 1mg Express Patna',
      address: 'Central Warehouse, Patna City',
      eta: 'Next-day Morning',
      stockStatus: 'In Stock',
      price: '₹188.00',
      tag: 'Online Courier'
    }
  ];

  const [selectedPharmacy, setSelectedPharmacy] = useState(pharmacies[0].name);

  if (!activeChemistModalTask) return null;

  const handleReroute = () => {
    resolveStockBlocker(activeChemistModalTask.id, selectedPharmacy);
    setActiveChemistModalTask(null);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-semibold">Find Alternate Pharmacy</h3>
                <p className="text-xs text-slate-400">Reroute out-of-stock medication in Patna network</p>
              </div>
            </div>

            <button
              type="button"
              aria-label="Close alternate pharmacy modal"
              onClick={() => setActiveChemistModalTask(null)}
              className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
              <strong>Stock Blocker:</strong> Sharma Medical Store reported <em>Vitamin D3 (Shellcal-D3)</em> is out of stock. Select an alternate verified chemist below:
            </div>

            <div className="space-y-2.5">
              {pharmacies.map((pharmacy) => {
                const isSelected = selectedPharmacy === pharmacy.name;
                return (
                  <div
                    key={pharmacy.name}
                    onClick={() => setSelectedPharmacy(pharmacy.name)}
                    className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer ${
                      isSelected
                        ? 'border-slate-900 bg-slate-50/80 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900">{pharmacy.name}</h4>
                          <span className="text-[10px] font-semibold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                            {pharmacy.tag}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {pharmacy.address}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-slate-900">{pharmacy.price}</span>
                      </div>
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                      <span className="text-emerald-700 font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {pharmacy.stockStatus}
                      </span>
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {pharmacy.eta}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveChemistModalTask(null)}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleReroute}
              className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg flex items-center gap-2 shadow-xs active:scale-[0.98] transition-all cursor-pointer"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Reroute Order to Selected Chemist</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
