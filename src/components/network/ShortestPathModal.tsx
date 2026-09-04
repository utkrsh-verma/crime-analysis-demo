import React, { useState, useEffect } from 'react';
import {
  GitFork,
  X,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Eye,
  Layers,
  Network,
  Maximize2,
  Phone,
  Landmark,
  Car,
  MapPin,
  Globe,
  ShieldAlert,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';
import { PoleType } from '../../types.js';

export const ShortestPathModal: React.FC = () => {
  const {
    isShortestPathOpen,
    setIsShortestPathOpen,
    isMultiHopOpen,
    setIsMultiHopOpen,
    entities,
    runMultiHopAnalysis,
    multiHopResult,
    selectedMultiHopIndex,
    selectMultiHopPath,
    clearMultiHop,
    runNeighborhoodDiscovery,
    neighborhoodResult,
    activeHopDepth,
    setActiveHopDepth,
    clearNeighborhood,
    focalEntityId,
    isLoading,
    setSelectedEntityId,
    activeCaseId,
  } = useInvestigationStore();

  const isOpen = isShortestPathOpen || isMultiHopOpen;

  const [activeTab, setActiveTab] = useState<'multi_hop' | 'neighborhood'>('multi_hop');
  const [sourceId, setSourceId] = useState('P001');
  const [targetId, setTargetId] = useState('P005');
  const [maxHops, setMaxHops] = useState(4);
  const [egoEntityId, setEgoEntityId] = useState('P001');
  const [egoMaxHops, setEgoMaxHops] = useState(2);
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Sync default entities if list loads late
  useEffect(() => {
    if (entities.length > 0) {
      if (!entities.some((e) => e.id === sourceId)) {
        setSourceId(entities[0].id);
      }
      if (!entities.some((e) => e.id === targetId)) {
        setTargetId(entities[Math.min(4, entities.length - 1)].id);
      }
      if (!entities.some((e) => e.id === egoEntityId)) {
        setEgoEntityId(entities[0].id);
      }
    }
  }, [entities]);

  // Sync with selectedEntityId if user opened modal while selecting an entity
  useEffect(() => {
    if (focalEntityId && entities.some((e) => e.id === focalEntityId)) {
      setEgoEntityId(focalEntityId);
      setActiveTab('neighborhood');
    }
  }, [focalEntityId, entities]);

  if (!isOpen) return null;

  const handleClose = () => {
    setIsShortestPathOpen(false);
    setIsMultiHopOpen(false);
  };

  const handleRunMultiHop = () => {
    if (sourceId && targetId) {
      runMultiHopAnalysis(sourceId, targetId, maxHops);
    }
  };

  const handleRunNeighborhood = () => {
    if (egoEntityId) {
      runNeighborhoodDiscovery(egoEntityId, egoMaxHops);
    }
  };

  const presets = [
    { label: 'Utkarsh (P001) ➔ Rohan (P005)', src: 'P001', tgt: 'P005', hops: 4, desc: 'Hawala dispatch conduit' },
    { label: 'Utkarsh (P001) ➔ Deepak (P015)', src: 'P001', tgt: 'P015', hops: 3, desc: 'Mule bank account trail' },
    { label: 'Aryan (P002) ➔ Kunal (P008)', src: 'P002', tgt: 'P008', hops: 4, desc: 'Cartel proxy network' },
    { label: 'Neha (P004) ➔ Tower 45 (LOC01)', src: 'P004', tgt: 'LOC01', hops: 3, desc: 'Cellular tower ping' },
  ];

  const getEntityIcon = (type: string, poleType: PoleType) => {
    if (poleType === 'LOCATION') return <MapPin className="w-3.5 h-3.5 text-orange-400" />;
    if (type === 'PHONE') return <Phone className="w-3.5 h-3.5 text-emerald-400" />;
    if (type === 'BANK_ACCOUNT') return <Landmark className="w-3.5 h-3.5 text-purple-400" />;
    if (type === 'VEHICLE') return <Car className="w-3.5 h-3.5 text-cyan-400" />;
    if (type === 'IP_ADDRESS') return <Globe className="w-3.5 h-3.5 text-indigo-400" />;
    return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6 overflow-hidden">
      <div
        id="multi-hop-analysis-modal"
        className="bg-[#080808] border border-white/10 rounded-sm shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header with Tab Navigation */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059] bg-[#c5a059]/10">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] uppercase tracking-[0.25em] text-[#c5a059] font-bold">
                  MULTI-HOP GRAPH ENGINE
                </span>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/[0.04] text-white/50 border border-white/5">
                  {activeCaseId}
                </span>
              </div>
              <h2 className="text-base font-serif text-white font-medium">
                Criminal Network Traversal & Conduit Analysis
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Mode Switcher */}
            <div className="flex bg-white/[0.03] p-0.5 rounded-sm border border-white/10 mr-2">
              <button
                onClick={() => setActiveTab('multi_hop')}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'multi_hop'
                    ? 'bg-[#c5a059]/20 text-[#c5a059] font-bold border border-[#c5a059]/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                Multi-Hop Paths
              </button>
              <button
                onClick={() => setActiveTab('neighborhood')}
                className={`px-3 py-1 text-[10px] uppercase tracking-wider font-mono rounded-sm transition-colors cursor-pointer ${
                  activeTab === 'neighborhood'
                    ? 'bg-[#c5a059]/20 text-[#c5a059] font-bold border border-[#c5a059]/40'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                N-Hop Neighborhood
              </button>
            </div>

            <button
              onClick={handleClose}
              className="p-1.5 rounded text-white/40 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* TAB 1: MULTI-HOP PATHS */}
          {activeTab === 'multi_hop' && (
            <div className="space-y-5">
              {/* Presets */}
              <div>
                <div className="text-[9px] uppercase tracking-[0.2em] text-white/40 mb-2 font-bold flex items-center gap-2">
                  <Sparkles className="w-3 h-3 text-[#c5a059]" />
                  <span>Verified Forensic Conduits (Operational Scenarios)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSourceId(p.src);
                        setTargetId(p.tgt);
                        setMaxHops(p.hops);
                        runMultiHopAnalysis(p.src, p.tgt, p.hops);
                      }}
                      className="p-2.5 rounded-sm bg-white/[0.02] border border-white/10 hover:border-[#c5a059]/50 text-left transition-colors cursor-pointer group"
                    >
                      <div className="text-[10px] text-white/80 font-mono group-hover:text-[#c5a059] truncate font-medium">
                        {p.label}
                      </div>
                      <div className="text-[9px] text-white/40 mt-0.5 font-sans truncate">
                        {p.desc}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Source, Target & Max Hops Controls */}
              <div className="p-4 rounded-sm bg-white/[0.02] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-5">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">
                    Source Entity (Starting Node)
                  </label>
                  <select
                    id="multihop-source-select"
                    value={sourceId}
                    onChange={(e) => setSourceId(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-[#c5a059]/60 font-sans"
                  >
                    {entities.map((e) => (
                      <option key={e.id} value={e.id} className="bg-[#0a0a0a] text-white">
                        [{e.id}] {e.name} ({e.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-5">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">
                    Target Entity (Destination Node)
                  </label>
                  <select
                    id="multihop-target-select"
                    value={targetId}
                    onChange={(e) => setTargetId(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-[#c5a059]/60 font-sans"
                  >
                    {entities.map((e) => (
                      <option key={e.id} value={e.id} className="bg-[#0a0a0a] text-white">
                        [{e.id}] {e.name} ({e.type})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">
                    Max Hops (Depth)
                  </label>
                  <select
                    value={maxHops}
                    onChange={(e) => setMaxHops(Number(e.target.value))}
                    className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-[#c5a059]/60 font-mono text-center"
                  >
                    <option value={1}>1 Hop</option>
                    <option value={2}>2 Hops</option>
                    <option value={3}>3 Hops</option>
                    <option value={4}>4 Hops</option>
                    <option value={5}>5 Hops</option>
                  </select>
                </div>
              </div>

              {/* Action Button */}
              <button
                id="btn-run-multihop"
                onClick={handleRunMultiHop}
                disabled={isLoading || sourceId === targetId}
                className="w-full py-3 rounded-sm border border-[#c5a059]/50 bg-[#c5a059]/10 hover:bg-[#c5a059]/20 text-[#c5a059] text-[10px] uppercase tracking-[0.25em] font-bold disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <GitFork className="w-4 h-4" />
                <span>
                  {isLoading ? 'Traversing Criminal Network Conduits...' : 'Execute Multi-Hop Analysis'}
                </span>
              </button>

              {/* Discovered Multi-Hop Paths Results */}
              {multiHopResult && (
                <div className="p-5 rounded-sm bg-white/[0.01] border border-white/10 space-y-4">
                  {/* Result Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-white/5">
                    <div className="flex items-center gap-2">
                      {multiHopResult.found ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-[#c5a059]" />
                          <span className="text-xs font-serif text-white font-medium">
                            Discovered {multiHopResult.totalPathsFound} Conduit
                            {multiHopResult.totalPathsFound !== 1 ? 's' : ''} (Shortest: {multiHopResult.minHops} Degree
                            {multiHopResult.minHops !== 1 ? 's' : ''} of Separation)
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4 text-rose-400" />
                          <span className="text-xs font-serif text-white">
                            No Associative Conduits Found Within {multiHopResult.maxHopsSearched} Hops
                          </span>
                        </>
                      )}
                    </div>

                    {multiHopResult.found && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => selectMultiHopPath(null)}
                          className={`text-[9px] px-2.5 py-1 rounded-sm uppercase tracking-wider font-mono transition-colors cursor-pointer ${
                            selectedMultiHopIndex === null
                              ? 'bg-[#c5a059] text-black font-bold'
                              : 'bg-white/[0.03] text-white/70 border border-white/10 hover:text-white'
                          }`}
                        >
                          Highlight All ({multiHopResult.totalPathsFound})
                        </button>
                      </div>
                    )}
                  </div>

                  {/* List of Discovered Conduits */}
                  {multiHopResult.paths.map((pathItem, pIdx) => {
                    const isSelected = selectedMultiHopIndex === pIdx;
                    return (
                      <div
                        key={pIdx}
                        className={`p-4 rounded-sm border transition-all ${
                          isSelected
                            ? 'bg-[#c5a059]/[0.06] border-[#c5a059]/60 shadow-lg'
                            : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40 font-bold">
                              Route #{pIdx + 1}
                            </span>
                            <span className="text-xs font-mono text-white/70">
                              {pathItem.hops} Hop{pathItem.hops !== 1 ? 's' : ''} Conduit
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => selectMultiHopPath(pIdx)}
                              className={`px-3 py-1 rounded-sm text-[9px] uppercase tracking-wider font-mono font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                                isSelected
                                  ? 'bg-[#c5a059] text-black font-bold'
                                  : 'bg-white/[0.04] text-white/80 hover:text-white border border-white/10'
                              }`}
                            >
                              <Eye className="w-3 h-3" />
                              <span>{isSelected ? 'Focused on Canvas' : 'Focus Route'}</span>
                            </button>
                          </div>
                        </div>

                        {/* Step-by-Step Entity Sequence */}
                        <div className="flex items-center flex-wrap gap-2 pt-1 pb-2 overflow-x-auto">
                          {pathItem.path.map((node, nIdx) => (
                            <React.Fragment key={node.entityId + nIdx}>
                              <button
                                onClick={() => {
                                  setSelectedEntityId(node.entityId);
                                }}
                                className="px-3 py-2 rounded-sm bg-black/60 border border-white/10 hover:border-[#c5a059]/50 text-left text-xs transition-colors cursor-pointer flex items-center gap-2 shrink-0 group"
                              >
                                {getEntityIcon(node.type, node.poleType)}
                                <div>
                                  <div className="font-serif text-white group-hover:text-[#c5a059] text-xs font-medium">
                                    {node.entityName}
                                  </div>
                                  <div className="text-[8px] text-white/40 font-mono">
                                    {node.entityId} • {node.type}
                                  </div>
                                </div>
                              </button>

                              {nIdx < pathItem.path.length - 1 && (
                                <div className="flex flex-col items-center px-1 shrink-0">
                                  <span className="text-[8px] font-mono text-[#c5a059] uppercase tracking-wider font-semibold">
                                    {pathItem.relationships[nIdx]?.type || 'CONNECTS'}
                                  </span>
                                  {pathItem.relationships[nIdx]?.label && (
                                    <span className="text-[7px] text-white/40 font-mono truncate max-w-[120px]">
                                      {pathItem.relationships[nIdx].label}
                                    </span>
                                  )}
                                  <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                                </div>
                              )}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: N-HOP NEIGHBORHOOD / EGO NETWORK */}
          {activeTab === 'neighborhood' && (
            <div className="space-y-5">
              <div className="p-4 rounded-sm bg-white/[0.02] border border-white/10 grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                <div className="sm:col-span-8">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">
                    Focal Target Entity (Origin Node)
                  </label>
                  <select
                    id="neighborhood-center-select"
                    value={egoEntityId}
                    onChange={(e) => setEgoEntityId(e.target.value)}
                    className="w-full bg-[#050505] border border-white/10 rounded-sm px-3 py-2 text-xs text-white/90 focus:outline-none focus:border-[#c5a059]/60 font-sans"
                  >
                    {entities.map((e) => (
                      <option key={e.id} value={e.id} className="bg-[#0a0a0a] text-white">
                        [{e.id}] {e.name} ({e.type} - Risk {e.riskScore})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-4">
                  <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1.5 font-bold">
                    Expansion Horizon (Degrees)
                  </label>
                  <div className="flex bg-[#050505] border border-white/10 p-0.5 rounded-sm">
                    {[1, 2, 3].map((hop) => (
                      <button
                        key={hop}
                        onClick={() => setEgoMaxHops(hop)}
                        className={`flex-1 py-1.5 text-xs font-mono font-semibold rounded-sm transition-colors cursor-pointer ${
                          egoMaxHops === hop
                            ? 'bg-[#c5a059] text-black'
                            : 'text-white/60 hover:text-white'
                        }`}
                      >
                        {hop} Hop{hop > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                id="btn-run-neighborhood"
                onClick={handleRunNeighborhood}
                disabled={isLoading || !egoEntityId}
                className="w-full py-3 rounded-sm border border-[#c5a059]/50 bg-[#c5a059]/10 hover:bg-[#c5a059]/20 text-[#c5a059] text-[10px] uppercase tracking-[0.25em] font-bold disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Layers className="w-4 h-4" />
                <span>
                  {isLoading ? 'Computing Ego Subnetwork...' : `Expand ${egoMaxHops}-Hop Neighborhood`}
                </span>
              </button>

              {/* Neighborhood Breakdown Results */}
              {neighborhoodResult && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-sm bg-white/[0.02] border border-white/10">
                    <div className="text-xs font-serif text-white">
                      <span className="text-[#c5a059] font-bold">{neighborhoodResult.centerEntityName}</span>
                      <span className="text-white/40"> — Subnetwork contains </span>
                      <span className="text-white font-mono font-bold">{neighborhoodResult.totalNodes} entities</span>
                      <span className="text-white/40"> and </span>
                      <span className="text-white font-mono font-bold">{neighborhoodResult.totalEdges} relations</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] text-white/40 font-mono mr-1">Filter Depth:</span>
                      <button
                        onClick={() => setActiveHopDepth('ALL')}
                        className={`px-2 py-0.5 text-[9px] font-mono rounded-sm cursor-pointer ${
                          activeHopDepth === 'ALL'
                            ? 'bg-[#c5a059] text-black font-bold'
                            : 'bg-white/[0.04] text-white/70 hover:text-white'
                        }`}
                      >
                        ALL
                      </button>
                      {[1, 2, 3].map((h) => (
                        <button
                          key={h}
                          onClick={() => setActiveHopDepth(h)}
                          className={`px-2 py-0.5 text-[9px] font-mono rounded-sm cursor-pointer ${
                            activeHopDepth === h
                              ? 'bg-[#c5a059] text-black font-bold'
                              : 'bg-white/[0.04] text-white/70 hover:text-white'
                          }`}
                        >
                          {h}H
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hop Layers Breakdown */}
                  {Object.entries(neighborhoodResult.nodesByHop).map(([hopStr, nodeList]) => {
                    const hopNum = Number(hopStr);
                    if (nodeList.length === 0) return null;

                    return (
                      <div key={hopNum} className="p-4 rounded-sm bg-white/[0.01] border border-white/5 space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-white/5">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[9px] font-mono px-2 py-0.5 rounded-sm font-bold ${
                                hopNum === 0
                                  ? 'bg-rose-950 text-rose-300 border border-rose-800'
                                  : hopNum === 1
                                  ? 'bg-[#c5a059]/20 text-[#c5a059] border border-[#c5a059]/40'
                                  : 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                              }`}
                            >
                              {hopNum === 0
                                ? 'ORIGIN (Hop 0)'
                                : hopNum === 1
                                ? '1ST DEGREE (Direct Associates)'
                                : `${hopNum}ND DEGREE (Intermediary Conduits)`}
                            </span>
                            <span className="text-xs text-white/50 font-mono">
                              ({nodeList.length} entities)
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                          {nodeList.map((node) => (
                            <button
                              key={node.entityId}
                              onClick={() => {
                                setSelectedEntityId(node.entityId);
                              }}
                              className="p-2.5 rounded-sm bg-black/50 border border-white/5 hover:border-[#c5a059]/50 text-left transition-colors cursor-pointer group flex items-start justify-between"
                            >
                              <div className="flex items-start gap-2 min-w-0">
                                {getEntityIcon(node.type, node.poleType)}
                                <div className="min-w-0">
                                  <div className="text-xs font-serif text-white group-hover:text-[#c5a059] truncate font-medium">
                                    {node.entityName}
                                  </div>
                                  <div className="text-[9px] text-white/40 font-mono mt-0.5">
                                    {node.entityId} • {node.type}
                                  </div>
                                </div>
                              </div>

                              <span
                                className={`text-[8px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                                  node.riskLevel === 'CRITICAL'
                                    ? 'bg-rose-950 text-rose-300 border border-rose-900'
                                    : node.riskLevel === 'HIGH'
                                    ? 'bg-amber-950 text-amber-300 border border-amber-900'
                                    : 'bg-slate-900 text-slate-400'
                                }`}
                              >
                                {node.riskScore}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-between bg-[#050505]">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                clearMultiHop();
                clearNeighborhood();
              }}
              className="text-[10px] uppercase tracking-widest text-white/40 hover:text-white transition-colors cursor-pointer"
            >
              Clear Highlighting
            </button>
          </div>

          <button
            onClick={handleClose}
            className="px-5 py-2 rounded-sm bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-white text-[10px] uppercase tracking-widest font-semibold transition-colors cursor-pointer"
          >
            Apply & Return to Canvas
          </button>
        </div>
      </div>
    </div>
  );
};
