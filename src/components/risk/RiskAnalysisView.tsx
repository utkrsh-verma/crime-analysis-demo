import React, { useState } from 'react';
import {
  ShieldAlert,
  Sliders,
  TrendingUp,
  Network,
  IndianRupee,
  PhoneCall,
  MapPin,
  Globe,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';
import { CentralityMetric } from '../../types.js';

export const RiskAnalysisView: React.FC = () => {
  const { centralityMetrics, entities, setSelectedEntityId, setActiveTab } =
    useInvestigationStore();

  const [expandedEntityId, setExpandedEntityId] = useState<string | null>('P001');

  const sortedMetrics = [...centralityMetrics].sort((a, b) => b.riskScore - a.riskScore);

  const getRiskColor = (level: string) => {
    if (level === 'CRITICAL') return 'text-rose-400 bg-rose-950 border-rose-800';
    if (level === 'HIGH') return 'text-amber-400 bg-amber-950 border-amber-800';
    if (level === 'MEDIUM') return 'text-blue-400 bg-blue-950 border-blue-800';
    return 'text-emerald-400 bg-emerald-950 border-emerald-800';
  };

  const ruleFactors = [
    {
      title: 'High Network Density',
      icon: Network,
      color: 'text-indigo-400',
      weight: '+15 to +25 pts',
      desc: 'Entities with 5+ or 10+ cross-vector links across cellular, financial, and physical operations.',
    },
    {
      title: 'Call Burst Telephony',
      icon: PhoneCall,
      color: 'text-emerald-400',
      weight: '+8 to +18 pts',
      desc: 'High-frequency short duration calls clustered within tactical operational windows.',
    },
    {
      title: 'Spatial Co-location Hotspot',
      icon: MapPin,
      color: 'text-orange-400',
      weight: '+15 pts',
      desc: 'Physical co-presence verified at identical cell towers (e.g. Tower 45 Cyber City) or safehouses.',
    },
    {
      title: 'High-Value Financial Anomaly',
      icon: IndianRupee,
      color: 'text-amber-400',
      weight: '+15 to +30 pts',
      desc: 'Transactions exceeding the FIU-IND anti-money-laundering threshold of ₹1,00,000.',
    },
    {
      title: 'Graph Centrality & PageRank',
      icon: TrendingUp,
      color: 'text-cyan-400',
      weight: '+12 pts',
      desc: 'High degree centrality and recursive structural influence acting as bridge nodes.',
    },
    {
      title: 'Anonymized Cyber Gateway',
      icon: Globe,
      color: 'text-purple-400',
      weight: '+12 pts',
      desc: 'Routing through offshore bulletproof proxy gateways or burner cellular equipment.',
    },
  ];

  return (
    <div id="risk-analysis-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-semibold">
            EXPLAINABLE AI (XAI)
          </span>
          <span className="text-xs text-slate-400 font-mono">
            RULE-BASED TRANSPARENT SCORING ENGINE
          </span>
        </div>
        <h1 className="text-xl font-bold font-display text-slate-100">
          Transparent Criminal Risk Scoring & Network Centrality
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Instead of opaque black-box machine learning outputs, CrimeNet Analyst derives 0–100 risk assessments from verifiable evidentiary signals:
          telephonic call bursts, spatial cell tower overlaps, high-value wire transfers, and mathematical PageRank centrality.
        </p>
      </div>

      {/* Explanatory Rule Pillars Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <h2 className="text-sm font-bold text-slate-200">
              Deterministic Scoring Methodology (0 – 100 Scale)
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
              Low: 0-30
            </span>
            <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-400 border border-blue-800">
              Med: 31-60
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
              High: 61-80
            </span>
            <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
              Crit: 81-100
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ruleFactors.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
                    <Icon className={`w-3.5 h-3.5 ${f.color}`} />
                    <span>{f.title}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold text-cyan-400">
                    {f.weight}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Centrality & Risk Score Ranking Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h2 className="text-sm font-bold text-slate-200">
              Priority Node Ranking & Graph Centrality Metrics
            </h2>
            <p className="text-xs text-slate-400">
              Entities ranked by computed risk score, degree centrality, and recursive PageRank influence
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {sortedMetrics.length} Scored Nodes
          </span>
        </div>

        <div className="divide-y divide-slate-800/80">
          {sortedMetrics.map((metric) => {
            const isExpanded = expandedEntityId === metric.entityId;
            const entity = entities.find((e) => e.id === metric.entityId);

            return (
              <div key={metric.entityId} className="hover:bg-slate-800/30 transition-colors">
                <div
                  className="px-5 py-3.5 flex items-center justify-between gap-4 cursor-pointer"
                  onClick={() => setExpandedEntityId(isExpanded ? null : metric.entityId)}
                >
                  <div className="flex items-center gap-3 min-w-[240px]">
                    <div className="w-8 h-8 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-center text-xs font-mono font-bold text-slate-300">
                      {metric.entityId.slice(0, 3)}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                        <span>{metric.entityName}</span>
                        {entity?.properties.role && (
                          <span className="text-[10px] text-slate-400 font-normal">
                            • {entity.properties.role}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-mono text-slate-400">
                        {metric.entityId} • {metric.type} ({metric.poleType})
                      </div>
                    </div>
                  </div>

                  {/* Quantitative Metric Columns */}
                  <div className="hidden sm:flex items-center gap-6 font-mono text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Connections</div>
                      <div className="font-semibold text-slate-200">{metric.connections} links</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">Degree Centrality</div>
                      <div className="font-semibold text-indigo-400">
                        {(metric.degreeCentrality * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase">PageRank Influence</div>
                      <div className="font-semibold text-cyan-400">{metric.pageRank}</div>
                    </div>
                  </div>

                  {/* Risk Score & Actions */}
                  <div className="flex items-center gap-3">
                    <span
                      className={`text-[11px] px-2.5 py-1 rounded font-mono font-bold border ${getRiskColor(
                        metric.riskLevel
                      )}`}
                    >
                      {metric.riskScore} / 100 • {metric.riskLevel}
                    </span>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedEntityId(metric.entityId);
                        setActiveTab('network');
                      }}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700 cursor-pointer"
                      title="Inspect in Network Canvas"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>

                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded XAI Breakdown */}
                {isExpanded && (
                  <div className="px-5 pb-4 pt-1 bg-slate-950/60 border-t border-slate-800/60 animate-in fade-in duration-150">
                    <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-200">
                          Explainable Scoring Audit Trail for {metric.entityName} [{metric.entityId}]
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400">
                          Transparent Audit
                        </span>
                      </div>
                      <div className="text-xs text-slate-300">
                        Evaluated across active evidence files: CDR cell records, banking transactions, vehicle ANPR captures, and FIR intelligence.
                      </div>
                      <div className="flex items-center gap-2 pt-2">
                        <button
                          onClick={() => {
                            setSelectedEntityId(metric.entityId);
                            setActiveTab('network');
                          }}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                        >
                          <Network className="w-3.5 h-3.5" />
                          <span>View Graph Neighborhood</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
