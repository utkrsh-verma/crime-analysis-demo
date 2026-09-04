import React from 'react';
import {
  LayoutDashboard,
  FolderGit2,
  FileSpreadsheet,
  Share2,
  Clock,
  Fingerprint,
  ShieldAlert,
  MessageSquareCode,
  CheckCheck,
  Settings,
  Shield,
} from 'lucide-react';
import { useInvestigationStore, NavigationTab } from '../../store/useInvestigationStore.js';

interface NavItem {
  id: NavigationTab;
  label: string;
  icon: React.ElementType;
  badge?: number | string;
  badgeColor?: string;
}

export const Sidebar: React.FC = () => {
  const { activeTab, setActiveTab, stats, evidence } = useInvestigationStore();

  const navItems: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Intelligence Overview',
      icon: LayoutDashboard,
    },
    {
      id: 'cases',
      label: 'Case Dossiers',
      icon: FolderGit2,
      badge: stats?.totalCases || 2,
      badgeColor: 'border-[#c5a059]/30 text-[#c5a059] bg-[#c5a059]/10',
    },
    {
      id: 'evidence',
      label: 'Evidence Intake',
      icon: FileSpreadsheet,
      badge: evidence.length,
      badgeColor: 'border-white/10 text-white/60 bg-white/[0.02]',
    },
    {
      id: 'network',
      label: 'Network Analysis',
      icon: Share2,
      badge: stats?.connectionsCount ? `${stats.connectionsCount}` : '50',
      badgeColor: 'border-[#c5a059]/30 text-[#c5a059] bg-[#c5a059]/10',
    },
    {
      id: 'timeline',
      label: 'Timeline Events',
      icon: Clock,
      badge: stats?.eventsCount,
    },
    {
      id: 'entities',
      label: 'POLE Directory',
      icon: Fingerprint,
      badge: stats?.totalEntities,
    },
    {
      id: 'risk',
      label: 'XAI Risk Engine',
      icon: ShieldAlert,
      badge: stats?.highRiskCount ? `${stats.highRiskCount} High` : 'Alerts',
      badgeColor: 'border-rose-900/50 text-rose-300 bg-rose-950/30',
    },
    {
      id: 'chat',
      label: 'Investigation Assistant',
      icon: MessageSquareCode,
    },
    {
      id: 'verify',
      label: 'Evidence Integrity',
      icon: CheckCheck,
      badge: 'SHA-256',
      badgeColor: 'border-[#c5a059]/30 text-[#c5a059] bg-[#c5a059]/10',
    },
    {
      id: 'settings',
      label: 'System Specifications',
      icon: Settings,
    },
  ];

  return (
    <aside
      id="crimenet-sidebar"
      className="w-64 bg-[#050505] border-r border-white/5 flex flex-col shrink-0 h-screen select-none relative z-20"
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full border border-[#c5a059]/30 flex items-center justify-center overflow-hidden">
            <div className="w-6 h-6 bg-gradient-to-tr from-[#c5a059] to-[#8e6e3d] rounded-full opacity-80 flex items-center justify-center text-[11px] font-serif font-bold text-black">
              C
            </div>
          </div>
          <div>
            <span className="text-[#d1d1d1] tracking-[0.3em] text-xs font-semibold uppercase block">
              CRIMENET
            </span>
            <span className="text-[9px] uppercase tracking-[0.25em] text-[#c5a059] font-medium block">
              Intelligence OS
            </span>
          </div>
        </div>
      </div>

      {/* Security Clearance Alert Banner */}
      <div className="mx-3 mt-3 px-3 py-2 rounded-sm bg-white/[0.02] border border-white/5 flex items-center justify-between text-[10px]">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059] animate-pulse"></span>
          <span className="text-[9px] uppercase tracking-widest text-white/50">Terminal</span>
        </div>
        <span className="text-[9px] uppercase tracking-[0.2em] text-[#c5a059] font-bold font-mono">
          SECURE • FIPS 180-4
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        <div className="px-2 pb-1.5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white/30">
          Intelligence Modules
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-sm text-xs transition-all duration-150 cursor-pointer ${
                isActive
                  ? 'bg-[#c5a059]/10 text-[#c5a059] border border-[#c5a059]/30 font-medium'
                  : 'text-white/40 hover:text-[#c5a059] hover:bg-white/[0.02] border border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={`w-4 h-4 transition-colors ${
                    isActive ? 'text-[#c5a059]' : 'text-white/40'
                  }`}
                />
                <span className="tracking-wide text-[11px]">{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-mono tracking-wider ${
                    item.badgeColor || 'border-white/10 text-white/40 bg-white/[0.01]'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Agency Identity Footer */}
      <div className="p-3.5 border-t border-white/5 bg-[#030303] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full border border-white/10 bg-white/[0.02] flex items-center justify-center text-[10px] font-serif font-bold text-[#c5a059]">
            VR
          </div>
          <div className="min-w-0">
            <p className="text-xs font-serif text-white/90 truncate leading-tight">
              Insp. Vikram Rathore
            </p>
            <p className="text-[9px] uppercase tracking-widest text-white/30 truncate mt-0.5">
              Special Cyber Cell
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};
