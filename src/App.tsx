import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
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
    <div className="dashboard-layout">
      {/* Fixed desktop sidebar */}
      <Sidebar />

      {/* Mobile Top & Bottom Navigation */}
      <MobileNav />

      {/* Main content area */}
      <main className="main-content">
        <div className="content-inner">
          <AnimatePresence mode="wait">
            {activeTab === 'command_board' && (
              <motion.div
                key="tab1"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <Tab1CommandBoard />
              </motion.div>
            )}

            {activeTab === 'document_intake' && (
              <motion.div
                key="tab2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <Tab2DocumentIntake />
              </motion.div>
            )}

            {activeTab === 'agent_trace' && (
              <motion.div
                key="tab3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.15 }}
              >
                <Tab3AgentTrace />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Demo Simulator dock */}
      <DemoSimulatorBar />

      {/* Toast notifications */}
      <ToastContainer />

      {/* Modals & Drawers */}
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
