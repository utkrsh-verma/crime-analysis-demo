import React from 'react';
import {
  Users,
  Share2,
  ShieldAlert,
  FileCheck2,
  IndianRupee,
  Layers,
  ArrowRight,
  TrendingUp,
  Fingerprint,
  Radio,
  ExternalLink,
  UploadCloud,
  Network,
  GitFork,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';

export const DashboardView: React.FC = () => {
  const {
    stats,
    entities,
    cases,
    activeCaseId,
    timeline,
    setActiveTab,
    setSelectedEntityId,
    setIsShortestPathOpen,
  } = useInvestigationStore();

  const currentCase = cases.find((c) => c.id === activeCaseId) || cases[0];
  const topSuspects = entities
    .filter((e) => e.poleType === 'PERSON')
    .sort((a, b) => b.riskScore - a.riskScore)
    .slice(0, 5);

  const transactionsByCase: Record<string, Array<{ from: string; to: string; amount: string; note: string }>> = {
    'CASE-001': [
      { from: 'Utkarsh Verma (P001)', to: 'Rohan Kapoor (P005)', amount: '₹2,50,000', note: 'Shell Hawala layering' },
      { from: 'Rahul Mehta (P003)', to: 'Sanjay Rawat (P009)', amount: '₹3,00,000', note: 'Vehicle procurement wire' },
      { from: 'P001 Primary Account', to: 'P003 Mule Account', amount: '₹1,50,000', note: 'Bulk tactical payoff' },
      { from: 'P001 Primary Account', to: 'Shell Corp Swift', amount: '₹5,00,000', note: 'International wire to UAE escrow' },
    ],
    'CASE-002': [
      { from: 'Tariq Merchant (P020)', to: 'Canara Marine Escrow (BA20)', amount: '₹45,00,000', note: 'Advance contraband freight clearing' },
      { from: 'Canara Marine Escrow (BA20)', to: 'Farhan Qureshi (P022)', amount: '₹12,50,000', note: 'Customs release facilitation fee' },
      { from: 'Tariq Merchant (P020)', to: 'Sameer Al-Balushi (P025)', amount: '₹28,00,000', note: 'Offshore Dhow charter collateral' },
      { from: 'Farhan Qureshi (P022)', to: 'Driver Amit (P024)', amount: '₹1,80,000', note: 'Container pilot road transit fee' },
    ],
    'CASE-003': [
      { from: 'Standard Chartered (BA30)', to: 'Emirates NBD Trust (BA31)', amount: '₹18,50,00,000', note: 'Layered outward remittance for bogus software' },
      { from: 'Harish Singhania (P030)', to: 'Kabir Chawla OTC (P032)', amount: '₹12,00,00,000', note: 'Cash to USDT crypto OTC conversion' },
      { from: 'Golden Crest SPV (OBJ30)', to: 'Anita Sen Consultancy (P031)', amount: '₹3,50,00,000', note: 'Bogus share valuation fee' },
      { from: 'Harish Singhania (P030)', to: 'Rajesh Malhotra (P034)', amount: '₹35,00,000', note: 'Municipal clearance payoff' },
    ],
  };

  const topTransactions = transactionsByCase[activeCaseId] || transactionsByCase['CASE-001'];

  return (
    <div id="dashboard-view" className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Case Header Dossier Banner with Sophisticated Dark Concentric Rings */}
      <div className="bg-[#080808] border border-white/10 rounded-sm p-8 relative overflow-hidden shadow-2xl">
        {/* Subtle geometric concentric rings from design sample */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/4 pointer-events-none opacity-25">
          <div className="w-[500px] h-[500px] border border-[#c5a059]/10 rounded-full flex items-center justify-center">
            <div className="w-[360px] h-[360px] border border-[#c5a059]/20 rounded-full flex items-center justify-center">
              <div className="w-[200px] h-[200px] border border-[#c5a059]/30 rounded-full"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-[#c5a059]"></span>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#c5a059] font-bold">
                Active Dossier • {currentCase?.id || 'CASE-001'}
              </span>
              <span className="text-[9px] uppercase tracking-widest text-white/40 ml-2 font-mono">
                {currentCase?.priority || 'CRITICAL'} PRIORITY
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-light text-white leading-tight font-serif">
              {currentCase?.title || 'Operation Shadow Ledger Syndicate'}
            </h1>
            <p className="text-xs text-white/50 max-w-2xl mt-2 leading-relaxed font-sans">
              {currentCase?.description ||
                'Unified POLE intelligence network analysis across telecommunication cellular intercepts, banking transactions, motor vehicle ANPR, and official FIR filings.'}
            </p>

            <div className="mt-4 flex items-center gap-4 text-[9px] uppercase tracking-widest text-white/40 font-mono">
              <span>Lead: {currentCase?.leadInvestigator || 'Insp. Vikram Rathore'}</span>
              <span>•</span>
              <span>Updated: {new Date(currentCase?.updatedDate || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('network')}
              className="px-5 py-3 border border-[#c5a059]/40 text-[#c5a059] text-[10px] uppercase tracking-[0.25em] font-bold hover:bg-[#c5a059]/10 rounded-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Explore Graph</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('network');
                setIsShortestPathOpen(true);
              }}
              className="px-4 py-3 bg-white/[0.02] border border-white/10 hover:border-[#c5a059]/40 text-white/80 text-[10px] uppercase tracking-[0.2em] font-medium rounded-sm transition-colors cursor-pointer flex items-center gap-2"
            >
              <GitFork className="w-3.5 h-3.5 text-[#c5a059]" />
              <span>Shortest Path</span>
            </button>
          </div>
        </div>
      </div>

      {/* Top 4 Core Metrics (High-Contrast Serif Luxury Display) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Entities */}
        <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-sm group hover:border-[#c5a059]/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="block text-[38px] font-serif text-white leading-none">
              {stats?.totalEntities || entities.length}
            </span>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c5a059] font-serif text-sm">
              E
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40 block">
            POLE Entities Indexed
          </span>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-[9px] font-mono text-white/40">
            <span className="text-[#c5a059]">{stats?.personsCount || 15} Persons</span>
            <span>•</span>
            <span>{stats?.objectsCount || 18} Objects</span>
            <span>•</span>
            <span>{stats?.locationsCount || 6} Locs</span>
          </div>
        </div>

        {/* Network Connections */}
        <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-sm group hover:border-[#c5a059]/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="block text-[38px] font-serif text-white leading-none">
              {stats?.connectionsCount || 50}
            </span>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c5a059] font-serif text-sm">
              N
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40 block">
            Associative Edges
          </span>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40">
            <span>Calls, Wires, ANPR</span>
            <span className="text-[#c5a059]">Graph Cohesion</span>
          </div>
        </div>

        {/* High Risk Targets */}
        <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-sm group hover:border-[#c5a059]/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="block text-[38px] font-serif text-[#d4b06a] leading-none">
              {stats?.highRiskCount || 29}
            </span>
            <div className="w-8 h-8 rounded-full border border-rose-900/40 flex items-center justify-center text-rose-400 font-serif text-sm">
              !
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40 block">
            High Severity Nodes
          </span>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-1.5 text-[9px] font-mono text-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
            <span>{stats?.riskDistribution?.critical || 12} Ring Leader Level</span>
          </div>
        </div>

        {/* Cryptographic Exhibits */}
        <div className="p-6 bg-white/[0.02] backdrop-blur-sm border border-white/10 rounded-sm group hover:border-[#c5a059]/40 transition-colors">
          <div className="flex justify-between items-start mb-4">
            <span className="block text-[38px] font-serif text-white leading-none">
              {stats?.evidenceFilesCount || 4}
            </span>
            <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c5a059] font-serif text-sm">
              §
            </div>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-white/40 block">
            Evidence Exhibits
          </span>
          <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-[9px] font-mono text-white/40">
            <span>SHA-256 Intact</span>
            <span className="text-[#c5a059]">100% Sealed</span>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Risk Distribution & Money Trail vs Priority Suspects */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (2 cols): Risk Distribution & Suspicious Financial Flows */}
        <div className="lg:col-span-2 space-y-8">
          {/* Risk Level Distribution Card */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#c5a059] font-bold block mb-1">
                  EVIDENTIARY AUDIT
                </span>
                <h2 className="text-xl font-serif text-white">Explainable Risk Distribution</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  Algorithmic scoring derived from call bursts, tower overlap, and Hawala transfers
                </p>
              </div>
              <button
                onClick={() => setActiveTab('risk')}
                className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059] hover:text-[#d4b06a] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <span>Full Matrix</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-sm bg-white/[0.01] border border-rose-900/40">
                <span className="text-[9px] text-rose-300 font-mono uppercase tracking-widest block">
                  Critical (81-100)
                </span>
                <div className="text-2xl font-serif text-white mt-1">
                  {stats?.riskDistribution?.critical || 12}
                </div>
                <div className="text-[9px] text-white/30 mt-1">Syndicate Heads</div>
              </div>

              <div className="p-4 rounded-sm bg-white/[0.01] border border-amber-900/40">
                <span className="text-[9px] text-amber-300 font-mono uppercase tracking-widest block">
                  High (61-80)
                </span>
                <div className="text-2xl font-serif text-white mt-1">
                  {stats?.riskDistribution?.high || 17}
                </div>
                <div className="text-[9px] text-white/30 mt-1">Tactical Operatives</div>
              </div>

              <div className="p-4 rounded-sm bg-white/[0.01] border border-white/10">
                <span className="text-[9px] text-white/60 font-mono uppercase tracking-widest block">
                  Medium (31-60)
                </span>
                <div className="text-2xl font-serif text-white mt-1">
                  {stats?.riskDistribution?.medium || 8}
                </div>
                <div className="text-[9px] text-white/30 mt-1">Peripheral Links</div>
              </div>

              <div className="p-4 rounded-sm bg-white/[0.01] border border-white/5">
                <span className="text-[9px] text-white/40 font-mono uppercase tracking-widest block">
                  Low (0-30)
                </span>
                <div className="text-2xl font-serif text-white mt-1">
                  {stats?.riskDistribution?.low || 2}
                </div>
                <div className="text-[9px] text-white/30 mt-1">Incidental Contacts</div>
              </div>
            </div>

            {/* Suspicious Transactions Preview */}
            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#c5a059]"></span>
                  <span className="text-xs font-serif text-white font-medium">
                    High-Value Financial Transfers (&gt; ₹1,00,000 Threshold)
                  </span>
                </div>
                <span className="text-[9px] uppercase tracking-widest text-[#c5a059] font-mono">
                  FIU-IND Wire Trail
                </span>
              </div>

              <div className="space-y-2.5">
                {topTransactions.map((tx, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-sm bg-white/[0.01] border border-white/5 hover:border-[#c5a059]/40 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-serif text-[#c5a059] text-base font-medium min-w-[80px]">
                        {tx.amount}
                      </span>
                      <div>
                        <div className="text-white/90 font-serif text-sm">
                          {tx.from} <span className="text-white/30">➔</span> {tx.to}
                        </div>
                        <div className="text-[10px] text-white/40">{tx.note}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('network')}
                      className="px-2.5 py-1 rounded-sm border border-white/10 hover:border-[#c5a059]/50 text-[9px] uppercase tracking-widest text-white/60 hover:text-[#c5a059] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Trace</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Chronological Event Timeline Preview */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#c5a059] font-bold block mb-1">
                  TEMPORAL ORDER
                </span>
                <h2 className="text-xl font-serif text-white">Chronological Surveillance Events</h2>
              </div>
              <button
                onClick={() => setActiveTab('timeline')}
                className="text-[10px] uppercase tracking-[0.2em] text-[#c5a059] hover:text-[#d4b06a] flex items-center gap-1 font-semibold transition-colors cursor-pointer"
              >
                <span>Full Ledger</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-px before:bg-white/10">
              {timeline.slice(0, 4).map((event) => (
                <div key={event.id} className="relative pl-6 flex items-start justify-between text-xs group">
                  <div className="absolute left-1 top-1.5 w-2 h-2 rounded-full bg-[#c5a059]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] uppercase tracking-wider text-white/40">
                        {new Date(event.timestamp).toLocaleString()}
                      </span>
                      <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded-sm bg-white/[0.03] text-[#c5a059] border border-white/10 font-mono">
                        {event.type}
                      </span>
                    </div>
                    <p className="text-white font-serif text-sm mt-1">{event.title}</p>
                    <p className="text-[11px] text-white/40 mt-0.5 leading-relaxed">{event.description}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (event.sourceEntityId) setSelectedEntityId(event.sourceEntityId);
                      setActiveTab('network');
                    }}
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-[#c5a059] hover:text-white"
                    title="View in graph"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 col): Key Suspects & Investigation Toolset */}
        <div className="space-y-8">
          {/* Key Suspects Priority Dossier */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#c5a059] font-bold block mb-0.5">
                  TARGET LIST
                </span>
                <h2 className="text-lg font-serif text-white">Priority Suspects</h2>
              </div>
              <button
                onClick={() => setActiveTab('entities')}
                className="text-[10px] uppercase tracking-widest text-white/40 hover:text-[#c5a059] transition-colors cursor-pointer"
              >
                All POLE
              </button>
            </div>

            <div className="space-y-3">
              {topSuspects.map((suspect) => (
                <div
                  key={suspect.id}
                  className="p-3.5 rounded-sm bg-white/[0.01] border border-white/5 hover:border-[#c5a059]/30 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-serif text-white font-medium">{suspect.name}</span>
                        {suspect.properties.alias && (
                          <span className="text-[9px] text-[#c5a059] font-mono">
                            ("{suspect.properties.alias}")
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-white/40 font-mono mt-0.5">
                        {suspect.id} • {suspect.properties.role || suspect.type}
                      </div>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-sm font-mono tracking-wider ${
                        suspect.riskLevel === 'CRITICAL'
                          ? 'border border-rose-900/60 text-rose-300 bg-rose-950/40'
                          : 'border border-amber-900/60 text-amber-300 bg-amber-950/40'
                      }`}
                    >
                      {suspect.riskScore}/100
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                    <span className="text-white/30 font-mono">
                      {suspect.evidenceIds.length} Linked Files
                    </span>
                    <button
                      onClick={() => {
                        setSelectedEntityId(suspect.id);
                        setActiveTab('network');
                      }}
                      className="text-[#c5a059] hover:text-white text-[10px] uppercase tracking-wider font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Analyze</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions Hub */}
          <div className="bg-white/[0.02] border border-white/10 rounded-sm p-6 space-y-4">
            <span className="text-[9px] uppercase tracking-[0.2em] text-[#c5a059] font-bold block mb-0.5">
              FORENSIC SUITE
            </span>
            <h2 className="text-lg font-serif text-white">Investigation Toolset</h2>
            <div className="grid grid-cols-1 gap-2.5 pt-1">
              <button
                onClick={() => setActiveTab('evidence')}
                className="w-full flex items-center justify-between p-3 rounded-sm bg-white/[0.01] border border-white/5 hover:border-[#c5a059]/40 hover:bg-white/[0.03] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c5a059]">
                    <UploadCloud className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-serif text-white group-hover:text-[#c5a059] transition-colors">
                      Upload Raw Evidence
                    </div>
                    <div className="text-[10px] text-white/40">CDR, Bank Wires, Vehicle ANPR</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#c5a059] transition-colors" />
              </button>

              <button
                onClick={() => {
                  setActiveTab('network');
                  setIsShortestPathOpen(true);
                }}
                className="w-full flex items-center justify-between p-3 rounded-sm bg-white/[0.01] border border-white/5 hover:border-[#c5a059]/40 hover:bg-white/[0.03] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c5a059]">
                    <GitFork className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-serif text-white group-hover:text-[#c5a059] transition-colors">
                      BFS Shortest Path Finder
                    </div>
                    <div className="text-[10px] text-white/40">Discover degrees of separation</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#c5a059] transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('verify')}
                className="w-full flex items-center justify-between p-3 rounded-sm bg-white/[0.01] border border-white/5 hover:border-[#c5a059]/40 hover:bg-white/[0.03] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c5a059]">
                    <FileCheck2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-serif text-white group-hover:text-[#c5a059] transition-colors">
                      Cryptographic Vault Audit
                    </div>
                    <div className="text-[10px] text-white/40">FIPS 180-4 SHA-256 seal verification</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#c5a059] transition-colors" />
              </button>

              <button
                onClick={() => setActiveTab('chat')}
                className="w-full flex items-center justify-between p-3 rounded-sm bg-white/[0.01] border border-white/5 hover:border-[#c5a059]/40 hover:bg-white/[0.03] transition-all text-left group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center text-[#c5a059]">
                    <Layers className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-xs font-serif text-white group-hover:text-[#c5a059] transition-colors">
                      Investigation Assistant
                    </div>
                    <div className="text-[10px] text-white/40">Natural language intelligence queries</div>
                  </div>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#c5a059] transition-colors" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
