import React, { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar.js';
import { TopBar } from './components/layout/TopBar.js';
import { DashboardView } from './components/dashboard/DashboardView.js';
import { NetworkAnalysisView } from './components/network/NetworkAnalysisView.js';
import { EvidenceUploadView } from './components/evidence/EvidenceUploadView.js';
import { EvidenceVerificationView } from './components/evidence/EvidenceVerificationView.js';
import { TimelineView } from './components/timeline/TimelineView.js';
import { EntitiesView } from './components/entities/EntitiesView.js';
import { RiskAnalysisView } from './components/risk/RiskAnalysisView.js';
import { InvestigationChatView } from './components/chat/InvestigationChatView.js';
import { CasesView } from './components/cases/CasesView.js';
import { SettingsView } from './components/settings/SettingsView.js';
import { useInvestigationStore } from './store/useInvestigationStore.js';

export default function App() {
  const { activeTab, refreshAllData } = useInvestigationStore();

  useEffect(() => {
    refreshAllData();
  }, []);

  const renderActiveView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'network':
        return <NetworkAnalysisView />;
      case 'evidence':
        return <EvidenceUploadView />;
      case 'verify':
        return <EvidenceVerificationView />;
      case 'timeline':
        return <TimelineView />;
      case 'entities':
        return <EntitiesView />;
      case 'risk':
        return <RiskAnalysisView />;
      case 'chat':
        return <InvestigationChatView />;
      case 'cases':
        return <CasesView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div id="crimenet-app-root" className="flex h-screen w-screen overflow-hidden bg-[#050505] text-[#d1d1d1] font-sans antialiased">
      {/* Primary Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto relative bg-[#080808]">
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
}
