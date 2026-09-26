import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/layout/Navbar';
import { GuardrailsModal } from './components/layout/GuardrailsModal';
import { AlertsDrawer } from './components/layout/AlertsDrawer';
import { ParentProfileModal } from './components/layout/ParentProfileModal';
import { Tab1CommandBoard } from './components/tabs/Tab1CommandBoard';
import { Tab2DocumentIntake } from './components/tabs/Tab2DocumentIntake';
import { Tab3AgentTrace } from './components/tabs/Tab3AgentTrace';
import { TranscriptModal } from './components/common/TranscriptModal';
import { WhatsAppPreviewModal } from './components/common/WhatsAppPreviewModal';
import { AlternateChemistModal } from './components/common/AlternateChemistModal';
import { AuditTraceDrawer } from './components/common/AuditTraceDrawer';
import { DistressModal } from './components/common/DistressModal';
import { DemoSimulatorBar } from './components/common/DemoSimulatorBar';
import { ToastContainer } from './components/common/Toast';

const DashboardContent: React.FC = () => {
  const { activeTab } = useApp();

  return (
    <div className="min-h-screen text-slate-900 flex flex-col selection:bg-slate-900 selection:text-white">
      {/* Global Navigation Bar */}
      <Navbar />

      {/* Main Container Across All Tabs with Viewport Hardening */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          {activeTab === 'command_board' && (
            <motion.div
              key="tab1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <Tab1CommandBoard />
            </motion.div>
          )}

          {activeTab === 'document_intake' && (
            <motion.div
              key="tab2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <Tab2DocumentIntake />
            </motion.div>
          )}

          {activeTab === 'agent_trace' && (
            <motion.div
              key="tab3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.18 }}
            >
              <Tab3AgentTrace />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Stage Demo Simulator (Fail-Safe Dock) */}
      <DemoSimulatorBar />

      {/* Toast Notifications System */}
      <ToastContainer />

      {/* Modal Dialogs & Drawers */}
      <GuardrailsModal />
      <AlertsDrawer />
      <ParentProfileModal />
      <TranscriptModal />
      <WhatsAppPreviewModal />
      <AlternateChemistModal />
      <AuditTraceDrawer />
      <DistressModal />
    </div>
  );
};

export function App() {
  return (
    <AppProvider>
      <DashboardContent />
    </AppProvider>
  );
}

export default App;
