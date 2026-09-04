import React, { useState } from 'react';
import {
  Search,
  RefreshCw,
  FolderOpen,
  Bell,
  CheckCircle2,
  AlertTriangle,
  FilePlus2,
  ExternalLink,
  Shield,
  Radio,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';

export const TopBar: React.FC = () => {
  const {
    activeCaseId,
    setActiveCaseId,
    cases,
    searchQuery,
    setSearchQuery,
    refreshAllData,
    isLoading,
    setActiveTab,
    setSelectedEntityId,
    entities,
  } = useInvestigationStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  // Search filtered entities
  const searchResults = searchQuery.trim()
    ? entities
        .filter(
          (e) =>
            e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
            JSON.stringify(e.properties).toLowerCase().includes(searchQuery.toLowerCase())
        )
        .slice(0, 6)
    : [];

  const mockAlerts = [
    {
      id: 1,
      type: 'critical',
      title: 'High-Value Shell Transfer Intercepted',
      desc: '₹2,50,000 transferred from P001 to P005 (FIU-IND alert trigger)',
      time: '12m ago',
    },
    {
      id: 2,
      type: 'warning',
      title: 'ANPR Spatial Co-location Verified',
      desc: 'Toyota Fortuner DL-01-AB-1234 flagged at Tower 45 Cyber City',
      time: '34m ago',
    },
    {
      id: 3,
      type: 'success',
      title: 'Evidence Hash Verified',
      desc: 'CDR_CYBERCITY_INTERCEPT_SEPT01.csv cryptographic SHA-256 intact',
      time: '1h ago',
    },
  ];

  return (
    <header
      id="crimenet-topbar"
      className="h-16 bg-[#050505] border-b border-white/5 px-6 flex items-center justify-between gap-6 select-none z-20"
    >
      {/* Left: Active Case Selector */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-sm bg-white/[0.02] border border-white/10 hover:border-[#c5a059]/40 transition-colors text-xs">
          <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]"></span>
          <span className="text-[9px] uppercase tracking-[0.2em] text-white/40 font-bold">
            Dossier:
          </span>
          <select
            id="active-case-select"
            value={activeCaseId}
            onChange={(e) => setActiveCaseId(e.target.value)}
            className="bg-transparent text-white/90 text-xs font-serif font-medium focus:outline-none cursor-pointer pr-2"
          >
            <option value="ALL" className="bg-[#0a0a0a] text-white">
              All Active Investigations (Consolidated)
            </option>
            {cases.map((c) => (
              <option key={c.id} value={c.id} className="bg-[#0a0a0a] text-white">
                {c.id} — {c.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Middle: Universal Search Bar with Live Suggestions */}
      <div className="relative flex-1 max-w-md">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-white/30 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            id="global-search-input"
            type="text"
            placeholder="Search POLE entities, IMEI, accounts, vehicles..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowSearchResults(true);
            }}
            onFocus={() => setShowSearchResults(true)}
            className="w-full bg-white/[0.02] border border-white/10 rounded-sm pl-9 pr-3 py-1.5 text-xs text-white/90 placeholder-white/20 focus:outline-none focus:border-[#c5a059]/60 transition-colors font-sans"
          />
        </div>

        {/* Live Search Dropdown */}
        {showSearchResults && searchResults.length > 0 && (
          <div
            id="search-results-dropdown"
            className="absolute left-0 right-0 top-full mt-1.5 bg-[#0a0a0a] border border-white/10 rounded-sm shadow-2xl py-1 z-50 overflow-hidden backdrop-blur-md"
          >
            <div className="px-3 py-1.5 text-[9px] uppercase font-bold text-white/30 tracking-[0.2em] border-b border-white/5">
              Matching Records ({searchResults.length})
            </div>
            {searchResults.map((entity) => (
              <button
                key={entity.id}
                onClick={() => {
                  setSelectedEntityId(entity.id);
                  setActiveTab('network');
                  setShowSearchResults(false);
                }}
                className="w-full px-3 py-2 text-left flex items-center justify-between hover:bg-white/[0.04] transition-colors border-b border-white/5 last:border-0"
              >
                <div>
                  <div className="text-xs font-serif text-white">{entity.name}</div>
                  <div className="text-[10px] text-white/40 font-mono">
                    {entity.id} • {entity.type} ({entity.poleType})
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-sm font-mono uppercase tracking-wider ${
                      entity.riskLevel === 'CRITICAL'
                        ? 'bg-rose-950/40 text-rose-300 border border-rose-900/60'
                        : entity.riskLevel === 'HIGH'
                        ? 'bg-amber-950/40 text-amber-300 border border-amber-900/60'
                        : 'bg-white/[0.02] text-white/60 border border-white/10'
                    }`}
                  >
                    Risk {entity.riskScore}
                  </span>
                  <ExternalLink className="w-3 h-3 text-[#c5a059]" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Quick Actions & Intelligence Alerts */}
      <div className="flex items-center gap-3">
        {/* Encryption/Network indicators from design sample */}
        <div className="hidden lg:flex items-center gap-4 text-[9px] uppercase tracking-widest text-white/30 border-r border-white/5 pr-4">
          <div className="flex items-center gap-1.5">
            <span className="text-white/40">Cipher</span>
            <span className="text-[#c5a059] font-mono">AES-256</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-white/50">Link Active</span>
          </div>
        </div>

        <button
          id="btn-quick-intake"
          onClick={() => setActiveTab('evidence')}
          className="flex items-center gap-2 px-4 py-2 rounded-sm border border-[#c5a059]/40 text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#c5a059]/10 transition-colors cursor-pointer"
        >
          <FilePlus2 className="w-3.5 h-3.5" />
          <span>Intake Evidence</span>
        </button>

        <button
          id="btn-refresh-data"
          onClick={() => refreshAllData()}
          title="Refresh All Investigation Records"
          className="p-2 rounded-sm bg-white/[0.02] border border-white/10 hover:border-[#c5a059]/40 text-white/50 hover:text-[#c5a059] transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#c5a059]' : ''}`} />
        </button>

        {/* Notifications Popover */}
        <div className="relative">
          <button
            id="btn-toggle-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-sm bg-white/[0.02] border border-white/10 hover:border-[#c5a059]/40 text-white/50 hover:text-[#c5a059] transition-colors relative cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[#c5a059]" />
          </button>

          {showNotifications && (
            <div
              id="notifications-popover"
              className="absolute right-0 top-full mt-2 w-80 bg-[#0a0a0a] border border-white/10 rounded-sm shadow-2xl p-3.5 z-50 backdrop-blur-md"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/5 mb-2.5">
                <span className="text-[10px] uppercase font-bold text-white tracking-[0.2em]">
                  Live Wire Dispatch
                </span>
                <span className="text-[9px] uppercase tracking-widest text-[#c5a059] font-mono">
                  Intercepts
                </span>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {mockAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="p-2.5 rounded-sm bg-white/[0.02] border border-white/5 hover:border-[#c5a059]/30 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px] font-medium text-white/90">
                      <div className="flex items-center gap-1.5">
                        {alert.type === 'critical' && <AlertTriangle className="w-3 h-3 text-rose-400" />}
                        {alert.type === 'warning' && <AlertTriangle className="w-3 h-3 text-amber-400" />}
                        {alert.type === 'success' && <CheckCircle2 className="w-3 h-3 text-[#c5a059]" />}
                        <span className="font-serif">{alert.title}</span>
                      </div>
                      <span className="text-[9px] text-white/30 font-mono">{alert.time}</span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1 leading-relaxed">{alert.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
