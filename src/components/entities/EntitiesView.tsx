import React, { useState } from 'react';
import {
  Users,
  Search,
  Phone,
  Landmark,
  Car,
  Globe,
  MapPin,
  ShieldAlert,
  ExternalLink,
  GitFork,
  CheckCircle2,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';
import { PoleType } from '../../types.js';

export const EntitiesView: React.FC = () => {
  const { entities, setSelectedEntityId, setActiveTab, setIsShortestPathOpen } =
    useInvestigationStore();

  const [activeTab, setActiveTabFilter] = useState<PoleType | 'ALL'>('ALL');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredEntities = entities.filter((e) => {
    if (activeTab !== 'ALL' && e.poleType !== activeTab) return false;
    if (riskFilter !== 'ALL' && e.riskLevel !== riskFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = e.name.toLowerCase().includes(q);
      const matchId = e.id.toLowerCase().includes(q);
      const matchProp = JSON.stringify(e.properties).toLowerCase().includes(q);
      if (!matchName && !matchId && !matchProp) return false;
    }
    return true;
  });

  const getEntityIcon = (type: string, poleType: string) => {
    if (poleType === 'LOCATION') return <MapPin className="w-4 h-4 text-orange-400" />;
    if (type === 'PHONE') return <Phone className="w-4 h-4 text-emerald-400" />;
    if (type === 'BANK_ACCOUNT') return <Landmark className="w-4 h-4 text-purple-400" />;
    if (type === 'VEHICLE') return <Car className="w-4 h-4 text-cyan-400" />;
    if (type === 'IP_ADDRESS') return <Globe className="w-4 h-4 text-indigo-400" />;
    return <Users className="w-4 h-4 text-rose-400" />;
  };

  const getRiskBadge = (score: number, level: string) => {
    if (level === 'CRITICAL') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-950 text-rose-300 border border-rose-800">
          Risk {score} • CRITICAL
        </span>
      );
    }
    if (level === 'HIGH') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-amber-950 text-amber-300 border border-amber-800">
          Risk {score} • HIGH
        </span>
      );
    }
    if (level === 'MEDIUM') {
      return (
        <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-blue-950 text-blue-300 border border-blue-800">
          Risk {score} • MEDIUM
        </span>
      );
    }
    return (
      <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-800">
        Risk {score} • LOW
      </span>
    );
  };

  return (
    <div id="entities-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
              POLE FRAMEWORK
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredEntities.length} Entities Indexed
            </span>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-100">
            POLE Entity Directory (Person, Object, Location, Event)
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Unified criminal intelligence registry standardizing entities across CDR, bank accounts, vehicles, and FIR filings
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, ID, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
          />
        </div>
      </div>

      {/* POLE Category Tabs & Risk Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-1.5">
          {(['ALL', 'PERSON', 'OBJECT', 'LOCATION'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTabFilter(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeTab === cat
                  ? 'bg-cyan-950 text-cyan-300 border border-cyan-800 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
              }`}
            >
              {cat === 'ALL' ? 'All Entities' : `${cat}S`}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-400">Risk Severity:</span>
          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg px-2.5 py-1 text-xs focus:outline-none focus:border-cyan-600 cursor-pointer"
          >
            <option value="ALL">All Levels</option>
            <option value="CRITICAL">Critical (81-100)</option>
            <option value="HIGH">High (61-80)</option>
            <option value="MEDIUM">Medium (31-60)</option>
            <option value="LOW">Low (0-30)</option>
          </select>
        </div>
      </div>

      {/* Entities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEntities.map((entity) => (
          <div
            key={entity.id}
            className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group shadow-sm"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 mt-0.5">
                    {getEntityIcon(entity.type, entity.poleType)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                      {entity.name}
                    </h3>
                    <div className="text-[11px] font-mono text-slate-400">
                      {entity.id} • {entity.type}
                    </div>
                  </div>
                </div>

                {getRiskBadge(entity.riskScore, entity.riskLevel)}
              </div>

              {/* Attributes / Key Properties */}
              <div className="mt-3 pt-3 border-t border-slate-800/80 space-y-1 text-xs">
                {Object.entries(entity.properties)
                  .slice(0, 3)
                  .map(([k, v]) => (
                    <div key={k} className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-400 capitalize">{k.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="text-slate-200 font-mono font-medium truncate max-w-[180px]">
                        {String(v)}
                      </span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                {entity.evidenceIds.length} Linked Evidence
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setSelectedEntityId(entity.id);
                    setActiveTab('network');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Inspect</span>
                  <ExternalLink className="w-3 h-3 text-cyan-400" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
