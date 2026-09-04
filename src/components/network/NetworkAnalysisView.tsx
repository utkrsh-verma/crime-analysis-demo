import React, { useEffect, useRef, useState } from 'react';
import cytoscape from 'cytoscape';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RefreshCw,
  GitFork,
  SlidersHorizontal,
  MapPin,
  Phone,
  Landmark,
  Car,
  Globe,
  ShieldAlert,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Network,
  Layers,
  Eye,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';
import { ShortestPathModal } from './ShortestPathModal.js';
import { CytoscapeNodeData, CytoscapeEdgeData } from '../../types.js';

const GRAPH_STYLES: cytoscape.StylesheetStyle[] = [
  // Base Node Styling
  {
    selector: 'node',
    style: {
      label: 'data(label)',
      'font-size': '10px',
      'font-family': 'Cormorant Garamond, serif',
      color: '#e5e5e5',
      'text-valign': 'bottom',
      'text-margin-y': 6,
      'text-background-opacity': 0.85,
      'text-background-color': '#050505',
      'text-background-padding': '3px',
      'border-width': 1.5,
      'border-color': '#333333',
      width: 32,
      height: 32,
      'transition-property': 'background-color, border-color, width, height, opacity',
      'transition-duration': 0.25,
    },
  },
  // POLE Person Node Styling
  {
    selector: 'node[poleType = "PERSON"]',
    style: {
      shape: 'ellipse',
      'background-color': '#c5a059',
      'border-color': '#e0c58a',
      width: 36,
      height: 36,
    },
  },
  // Critical Risk Nodes
  {
    selector: 'node[riskLevel = "CRITICAL"]',
    style: {
      'background-color': '#991b1b',
      'border-color': '#f87171',
      'border-width': 2.5,
      width: 42,
      height: 42,
      color: '#ffffff',
    },
  },
  // High Risk Nodes
  {
    selector: 'node[riskLevel = "HIGH"]',
    style: {
      'background-color': '#92400e',
      'border-color': '#fbbf24',
      'border-width': 2,
      width: 36,
      height: 36,
    },
  },
  // Phone Nodes
  {
    selector: 'node[type = "PHONE"]',
    style: { shape: 'round-rectangle', 'background-color': '#065f46', 'border-color': '#34d399' },
  },
  // Bank Account Nodes
  {
    selector: 'node[type = "BANK_ACCOUNT"]',
    style: { shape: 'tag', 'background-color': '#581c87', 'border-color': '#c084fc' },
  },
  // Vehicle Nodes
  {
    selector: 'node[type = "VEHICLE"]',
    style: { shape: 'diamond', 'background-color': '#0e7490', 'border-color': '#22d3ee' },
  },
  // IP Address Nodes
  {
    selector: 'node[type = "IP_ADDRESS"]',
    style: { shape: 'octagon', 'background-color': '#3730a3', 'border-color': '#818cf8' },
  },
  // Location Nodes
  {
    selector: 'node[poleType = "LOCATION"]',
    style: { shape: 'pentagon', 'background-color': '#9a3412', 'border-color': '#fb923c' },
  },
  // Edges styling
  {
    selector: 'edge',
    style: {
      width: 1.5,
      'line-color': '#262626',
      'target-arrow-color': '#404040',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 0.8,
      label: 'data(label)',
      'font-size': '8px',
      'font-family': 'JetBrains Mono, monospace',
      color: '#888888',
      'text-background-opacity': 0.9,
      'text-background-color': '#050505',
      'text-background-padding': '2px',
      'text-rotation': 'autorotate',
      opacity: 0.75,
    },
  },
  // Financial Transfers Edge Styling
  {
    selector: 'edge[type = "TRANSFERRED"]',
    style: {
      'line-color': '#c5a059',
      'target-arrow-color': '#c5a059',
      width: 2.2,
    },
  },
  // Highlighted Nodes
  {
    selector: '.highlighted-node',
    style: {
      'border-width': 4,
      'border-color': '#c5a059',
      'border-opacity': 1,
      'z-index': 9999,
    },
  },
  // Highlighted Edges (e.g. Shortest Path)
  {
    selector: '.highlighted-edge',
    style: {
      'line-color': '#c5a059',
      'target-arrow-color': '#c5a059',
      width: 3.5,
      opacity: 1,
      'z-index': 9999,
      'arrow-scale': 1.2,
    },
  },
  // Selected Node
  {
    selector: '.selected-node',
    style: {
      'border-width': 4,
      'border-color': '#ffffff',
      'border-opacity': 1,
      'z-index': 10000,
    },
  },
  // Dimmed elements when highlight is active
  {
    selector: '.dimmed',
    style: {
      opacity: 0.12,
    },
  },
];

export const NetworkAnalysisView: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const layoutRef = useRef<cytoscape.Layouts | null>(null);

  const {
    graphData,
    selectedEntityId,
    setSelectedEntityId,
    selectedEntityDetails,
    setIsShortestPathOpen,
    isMultiHopOpen,
    setIsMultiHopOpen,
    multiHopResult,
    selectedMultiHopIndex,
    selectMultiHopPath,
    clearMultiHop,
    neighborhoodResult,
    activeHopDepth,
    setActiveHopDepth,
    clearNeighborhood,
    runNeighborhoodDiscovery,
    runMultiHopAnalysis,
    highlightedNodeIds,
    highlightedEdgeIds,
    clearHighlights,
    filterEntityType,
    setFilterEntityType,
    filterRiskLevel,
    setFilterRiskLevel,
    searchQuery,
    setSearchQuery,
    entities,
  } = useInvestigationStore();

  const [activeLayout, setActiveLayout] = useState<'cose' | 'concentric' | 'circle' | 'breadthfirst'>('cose');
  const [showFilters, setShowFilters] = useState(false);

  // Initialize Cytoscape core instance ONCE on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements: [],
      style: GRAPH_STYLES,
      layout: { name: 'null' },
      wheelSensitivity: 0.3,
      boxSelectionEnabled: false,
    });

    // Node click handler: open details drawer
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      setSelectedEntityId(node.id());
    });

    // Background click handler: deselect
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        setSelectedEntityId(null);
      }
    });

    cyRef.current = cy;

    // Responsive container resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (cyRef.current && !cyRef.current.destroyed()) {
        cyRef.current.resize();
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
      if (layoutRef.current) {
        try {
          layoutRef.current.stop();
        } catch (_) {}
        layoutRef.current = null;
      }
      if (cyRef.current) {
        try {
          if (!cyRef.current.destroyed()) {
            cyRef.current.removeAllListeners();
            cyRef.current.destroy();
          }
        } catch (_) {}
        cyRef.current = null;
      }
    };
  }, []);

  // Update elements and layout when data/filters change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    // Filter nodes based on user criteria
    const filteredNodes = graphData.nodes.filter((nodeItem) => {
      const node = nodeItem.data;
      if (filterEntityType !== 'ALL') {
        if (node.poleType !== filterEntityType && node.type !== filterEntityType) {
          return false;
        }
      }
      if (filterRiskLevel !== 'ALL' && node.riskLevel !== filterRiskLevel) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          node.label.toLowerCase().includes(q) ||
          node.id.toLowerCase().includes(q) ||
          node.type.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const visibleNodeIds = new Set(filteredNodes.map((n) => n.data.id));

    // Filter edges connected to visible nodes
    const filteredEdges = graphData.edges.filter(
      (edgeItem) => visibleNodeIds.has(edgeItem.data.source) && visibleNodeIds.has(edgeItem.data.target)
    );

    // Convert to Cytoscape elements
    const elements: cytoscape.ElementDefinition[] = [
      ...filteredNodes.map((n) => ({
        group: 'nodes' as const,
        data: {
          ...n.data,
        },
      })),
      ...filteredEdges.map((e) => ({
        group: 'edges' as const,
        data: {
          ...e.data,
        },
      })),
    ];

    // Safely stop any pending layout before updating elements
    if (layoutRef.current) {
      try {
        layoutRef.current.stop();
      } catch (_) {}
      layoutRef.current = null;
    }

    try {
      cy.batch(() => {
        if (cy.destroyed()) return;
        cy.elements().remove();
        cy.add(elements);
      });

      // Synchronous layout run avoids hanging requestAnimationFrames across unmounts
      const layout = cy.layout({
        name: activeLayout,
        animate: false,
        nodeDimensionsIncludeLabels: true,
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 40,
        randomize: false,
      } as any);

      layoutRef.current = layout;
      layout.run();
    } catch (err) {
      console.warn('Cytoscape layout update error:', err);
    }
  }, [graphData, filterEntityType, filterRiskLevel, searchQuery, activeLayout]);

  // Apply Highlights & Dimming when highlightedNodeIds/highlightedEdgeIds change
  useEffect(() => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;

    try {
      cy.batch(() => {
        if (cy.destroyed()) return;
        cy.elements().removeClass('highlighted-node highlighted-edge dimmed selected-node');

        const hasHighlights = highlightedNodeIds.length > 0 || highlightedEdgeIds.length > 0;

        if (hasHighlights) {
          cy.elements().addClass('dimmed');

          highlightedNodeIds.forEach((id) => {
            const node = cy.getElementById(id);
            if (node && node.nonempty()) {
              node.removeClass('dimmed').addClass('highlighted-node');
            }
          });

          highlightedEdgeIds.forEach((id) => {
            const edge = cy.getElementById(id);
            if (edge && edge.nonempty()) {
              edge.removeClass('dimmed').addClass('highlighted-edge');
            }
          });
        }

        // Highlight currently selected entity
        if (selectedEntityId) {
          const selNode = cy.getElementById(selectedEntityId);
          if (selNode && selNode.nonempty()) {
            selNode.removeClass('dimmed').addClass('selected-node');
            // Only un-dim neighborhood if there are no global multi-hop or path highlights
            if (!hasHighlights) {
              const connected = selNode.neighborhood();
              connected.removeClass('dimmed');
            }
          }
        }
      });

      // Camera auto-focus: if highlights exist, smoothly pan and zoom to the conduit
      const hasHighlights = highlightedNodeIds.length > 0;
      if (hasHighlights) {
        const highlightedEles = cy.collection();
        highlightedNodeIds.forEach((id) => {
          const node = cy.getElementById(id);
          if (node && node.nonempty()) highlightedEles.merge(node);
        });
        highlightedEdgeIds.forEach((id) => {
          const edge = cy.getElementById(id);
          if (edge && edge.nonempty()) highlightedEles.merge(edge);
        });

        if (highlightedEles.length > 0) {
          cy.animate({
            fit: {
              eles: highlightedEles,
              padding: 60,
            },
            duration: 350,
          });
        }
      }
    } catch (err) {
      console.warn('Cytoscape highlight error:', err);
    }
  }, [highlightedNodeIds, highlightedEdgeIds, selectedEntityId]);

  // Cytoscape Canvas Controls
  const handleZoomIn = () => {
    const cy = cyRef.current;
    if (cy && !cy.destroyed()) cy.zoom(cy.zoom() * 1.25);
  };
  const handleZoomOut = () => {
    const cy = cyRef.current;
    if (cy && !cy.destroyed()) cy.zoom(cy.zoom() * 0.8);
  };
  const handleFit = () => {
    const cy = cyRef.current;
    if (cy && !cy.destroyed()) cy.fit(undefined, 30);
  };
  const handleResetLayout = () => {
    const cy = cyRef.current;
    if (!cy || cy.destroyed()) return;
    if (layoutRef.current) {
      try {
        layoutRef.current.stop();
      } catch (_) {}
    }
    const layout = cy.layout({
      name: activeLayout,
      animate: false,
      fit: true,
      padding: 40,
    } as any);
    layoutRef.current = layout;
    layout.run();
  };

  const getEntityIcon = (type: string, poleType: string) => {
    if (poleType === 'LOCATION') return <MapPin className="w-4 h-4 text-[#fb923c]" />;
    if (type === 'PHONE') return <Phone className="w-4 h-4 text-[#34d399]" />;
    if (type === 'BANK_ACCOUNT') return <Landmark className="w-4 h-4 text-[#c084fc]" />;
    if (type === 'VEHICLE') return <Car className="w-4 h-4 text-[#22d3ee]" />;
    if (type === 'IP_ADDRESS') return <Globe className="w-4 h-4 text-[#818cf8]" />;
    return <ShieldAlert className="w-4 h-4 text-[#f87171]" />;
  };

  return (
    <div id="network-analysis-view" className="relative w-full h-[calc(100vh-4rem)] flex overflow-hidden bg-[#050505]">
      {/* Shortest Path Modal */}
      <ShortestPathModal />

      {/* Main Canvas Area */}
      <div className="flex-1 relative bg-[#050505] flex flex-col">
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-6 right-6 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Left: Quick Filters & Search */}
          <div className="flex items-center gap-2 pointer-events-auto bg-[#0a0a0a]/90 backdrop-blur-md p-1.5 rounded-sm border border-white/10 shadow-2xl">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-3 py-1.5 rounded-sm text-[10px] uppercase tracking-widest font-bold flex items-center gap-1.5 transition-colors cursor-pointer ${
                showFilters || filterEntityType !== 'ALL' || filterRiskLevel !== 'ALL'
                  ? 'bg-white/[0.05] text-[#c5a059] border border-[#c5a059]/40'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            {/* Layout Switcher */}
            <div className="flex items-center gap-1 pl-2 border-l border-white/10">
              {(['cose', 'concentric', 'circle', 'breadthfirst'] as const).map((layout) => (
                <button
                  key={layout}
                  onClick={() => setActiveLayout(layout)}
                  className={`px-2.5 py-1 rounded-sm text-[9px] uppercase tracking-widest font-mono transition-colors cursor-pointer ${
                    activeLayout === layout
                      ? 'bg-white/[0.06] text-[#c5a059] font-bold border border-[#c5a059]/30'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {layout}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Path Finding & Clear Tools */}
          <div className="flex items-center gap-2 pointer-events-auto bg-[#0a0a0a]/90 backdrop-blur-md p-1.5 rounded-sm border border-white/10 shadow-2xl">
            <button
              id="btn-open-multihop"
              onClick={() => setIsMultiHopOpen(true)}
              className="px-4 py-2 rounded-sm border border-[#c5a059]/60 bg-[#c5a059]/10 text-[#c5a059] text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-[#c5a059]/20 transition-colors cursor-pointer flex items-center gap-2 shadow-sm"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Multi-Hop Analysis</span>
            </button>

            {(highlightedNodeIds.length > 0 || highlightedEdgeIds.length > 0) && (
              <button
                onClick={() => {
                  clearHighlights();
                  clearMultiHop();
                  clearNeighborhood();
                }}
                className="px-3 py-2 rounded-sm bg-white/[0.02] hover:bg-white/[0.05] text-rose-300 text-[10px] uppercase tracking-widest font-semibold border border-rose-900/40 transition-colors cursor-pointer"
              >
                Clear Highlights
              </button>
            )}
          </div>
        </div>

        {/* ACTIVE MULTI-HOP / NEIGHBORHOOD HUD BANNER */}
        {(multiHopResult || neighborhoodResult) && (
          <div className="absolute top-16 left-6 right-6 z-20 pointer-events-auto bg-[#0a0a0a]/95 backdrop-blur-md border border-[#c5a059]/40 rounded-sm p-3 shadow-2xl flex flex-wrap items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-150">
            {/* Multi-Hop Path Active View */}
            {multiHopResult && (
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059]">
                    <GitFork className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#c5a059] font-bold block">
                      Multi-Hop Conduit Active
                    </span>
                    <span className="text-xs text-white font-serif">
                      {selectedMultiHopIndex !== null
                        ? `Route #${selectedMultiHopIndex + 1} of ${multiHopResult.totalPathsFound} (${multiHopResult.paths[selectedMultiHopIndex]?.hops} Hops)`
                        : `All ${multiHopResult.totalPathsFound} Conduits Highlighted`}
                    </span>
                  </div>
                </div>

                {multiHopResult.paths.length > 1 && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <button
                      onClick={() => {
                        const nextIdx =
                          selectedMultiHopIndex === null || selectedMultiHopIndex === 0
                            ? multiHopResult.paths.length - 1
                            : selectedMultiHopIndex - 1;
                        selectMultiHopPath(nextIdx);
                      }}
                      className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/10 text-xs cursor-pointer"
                      title="Previous Route"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        const nextIdx =
                          selectedMultiHopIndex === null || selectedMultiHopIndex === multiHopResult.paths.length - 1
                            ? 0
                            : selectedMultiHopIndex + 1;
                        selectMultiHopPath(nextIdx);
                      }}
                      className="p-1 rounded bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/10 text-xs cursor-pointer"
                      title="Next Route"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => selectMultiHopPath(null)}
                      className={`px-2 py-1 text-[9px] font-mono rounded cursor-pointer ${
                        selectedMultiHopIndex === null
                          ? 'bg-[#c5a059] text-black font-bold'
                          : 'bg-white/[0.04] text-white/70 hover:text-white border border-white/10'
                      }`}
                    >
                      All Routes
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Neighborhood Active View */}
            {neighborhoodResult && !multiHopResult && (
              <div className="flex items-center flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#c5a059]/20 border border-[#c5a059]/40 flex items-center justify-center text-[#c5a059]">
                    <Layers className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-widest text-[#c5a059] font-bold block">
                      Ego Subnetwork Horizon
                    </span>
                    <span className="text-xs text-white font-serif">
                      Focal Target: {neighborhoodResult.centerEntityName} ({neighborhoodResult.totalNodes} Nodes)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 ml-2">
                  <span className="text-[9px] text-white/40 font-mono">Depth:</span>
                  <button
                    onClick={() => setActiveHopDepth('ALL')}
                    className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer ${
                      activeHopDepth === 'ALL'
                        ? 'bg-[#c5a059] text-black font-bold'
                        : 'bg-white/[0.04] text-white/70 hover:text-white border border-white/10'
                    }`}
                  >
                    ALL
                  </button>
                  {[1, 2, 3].map((h) => (
                    <button
                      key={h}
                      onClick={() => setActiveHopDepth(h)}
                      className={`px-2 py-0.5 text-[9px] font-mono rounded cursor-pointer ${
                        activeHopDepth === h
                          ? 'bg-[#c5a059] text-black font-bold'
                          : 'bg-white/[0.04] text-white/70 hover:text-white border border-white/10'
                      }`}
                    >
                      {h}H
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* HUD Right Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMultiHopOpen(true)}
                className="px-3 py-1 text-[9px] uppercase tracking-wider font-mono bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border border-white/10 rounded cursor-pointer"
              >
                Inspect Conduits
              </button>
              <button
                onClick={() => {
                  clearMultiHop();
                  clearNeighborhood();
                }}
                className="p-1 rounded text-white/40 hover:text-white hover:bg-white/[0.05] cursor-pointer"
                title="Dismiss Analysis"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Expandable Filter Panel */}
        {showFilters && (
          <div className="absolute top-16 left-6 z-10 bg-[#0a0a0a]/95 backdrop-blur-md border border-white/10 rounded-sm p-4 shadow-2xl max-w-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-xs font-serif text-white">Network Filtering</span>
              <button
                onClick={() => {
                  setFilterEntityType('ALL');
                  setFilterRiskLevel('ALL');
                  setSearchQuery('');
                }}
                className="text-[9px] uppercase tracking-widest text-[#c5a059] hover:underline"
              >
                Reset All
              </button>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">
                Entity Category
              </label>
              <select
                value={filterEntityType}
                onChange={(e) => setFilterEntityType(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white/90 focus:outline-none focus:border-[#c5a059]/50"
              >
                <option value="ALL">All POLE Categories</option>
                <option value="PERSON">Persons (Suspects / Ringleaders)</option>
                <option value="OBJECT">Objects (Phones / Accounts / Vehicles)</option>
                <option value="LOCATION">Locations (Cell Towers / Safehouses)</option>
                <option value="PHONE">Phones Only</option>
                <option value="BANK_ACCOUNT">Bank Accounts Only</option>
                <option value="VEHICLE">Vehicles Only</option>
                <option value="IP_ADDRESS">IP Addresses Only</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] uppercase tracking-widest text-white/40 mb-1 font-bold">
                Risk Classification
              </label>
              <select
                value={filterRiskLevel}
                onChange={(e) => setFilterRiskLevel(e.target.value)}
                className="w-full bg-[#050505] border border-white/10 rounded-sm px-2.5 py-1.5 text-xs text-white/90 focus:outline-none focus:border-[#c5a059]/50"
              >
                <option value="ALL">All Risk Levels</option>
                <option value="CRITICAL">Critical (81 - 100)</option>
                <option value="HIGH">High (61 - 80)</option>
                <option value="MEDIUM">Medium (31 - 60)</option>
                <option value="LOW">Low (0 - 30)</option>
              </select>
            </div>
          </div>
        )}

        {/* Legend Overlay at Bottom-Left */}
        <div className="absolute bottom-6 left-6 z-10 bg-[#0a0a0a]/90 backdrop-blur-md border border-white/10 rounded-sm p-3.5 shadow-2xl hidden sm:block text-[11px] space-y-1.5">
          <div className="text-[9px] uppercase font-bold text-white/40 tracking-[0.2em] mb-1.5">
            POLE Taxonomy
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#c5a059]" />
            <span className="text-white/80 font-serif">Person / Subject</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="text-white/80 font-serif">Critical Risk Node</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-white/80 font-serif">Phone / SIM Intercept</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
            <span className="text-white/80 font-serif">Bank Account / Mule</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rotate-45 bg-cyan-500" />
            <span className="text-white/80 font-serif">Vehicle / ANPR</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-sm bg-orange-500" />
            <span className="text-white/80 font-serif">Location / Cell Tower</span>
          </div>
        </div>

        {/* Floating Zoom & Canvas Controls */}
        <div className="absolute bottom-6 right-6 z-10 flex flex-col gap-1.5 bg-[#0a0a0a]/90 backdrop-blur-md p-1.5 rounded-sm border border-white/10 shadow-2xl">
          <button
            onClick={handleZoomIn}
            title="Zoom In"
            className="p-2 rounded-sm text-white/50 hover:text-[#c5a059] hover:bg-white/[0.04] transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            title="Zoom Out"
            className="p-2 rounded-sm text-white/50 hover:text-[#c5a059] hover:bg-white/[0.04] transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleFit}
            title="Fit to Canvas"
            className="p-2 rounded-sm text-white/50 hover:text-[#c5a059] hover:bg-white/[0.04] transition-colors"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetLayout}
            title="Re-run Force Layout"
            className="p-2 rounded-sm text-white/50 hover:text-[#c5a059] hover:bg-white/[0.04] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Cytoscape Rendering Div */}
        <div
          id="cy-canvas"
          ref={containerRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
        />
      </div>

      {/* Right Drawer: Selected Entity Analysis & Explainable AI */}
      {selectedEntityDetails && (
        <aside
          id="entity-analysis-drawer"
          className="w-96 bg-[#080808] border-l border-white/10 h-full flex flex-col shrink-0 shadow-2xl z-20"
        >
          {/* Drawer Header */}
          <div className="p-5 border-b border-white/5 flex items-start justify-between bg-[#050505]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center mt-0.5">
                {getEntityIcon(selectedEntityDetails.entity.type, selectedEntityDetails.entity.poleType)}
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#c5a059] font-bold block mb-0.5">
                  NODE INSPECTION
                </span>
                <h3 className="text-base font-serif text-white">
                  {selectedEntityDetails.entity.name}
                </h3>
                <p className="text-[10px] text-white/40 font-mono mt-0.5">
                  {selectedEntityDetails.entity.id} • {selectedEntityDetails.entity.type}
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedEntityId(null)}
              className="p-1 rounded text-white/40 hover:text-white hover:bg-white/[0.05]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="p-5 space-y-5 flex-1 overflow-y-auto">
            {/* Risk Assessment Score Banner */}
            <div className="p-4 rounded-sm bg-white/[0.02] border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-serif text-white flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-[#c5a059]" />
                  <span>Risk Severity Score</span>
                </span>
                <span
                  className={`text-[9px] px-2 py-0.5 rounded-sm font-mono tracking-wider ${
                    selectedEntityDetails.risk.level === 'CRITICAL'
                      ? 'border border-rose-900/60 text-rose-300 bg-rose-950/40'
                      : selectedEntityDetails.risk.level === 'HIGH'
                      ? 'border border-amber-900/60 text-amber-300 bg-amber-950/40'
                      : 'border border-white/10 text-white/60'
                  }`}
                >
                  {selectedEntityDetails.risk.level}
                </span>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-serif text-white">
                  {selectedEntityDetails.risk.score}
                </span>
                <span className="text-xs text-white/30 font-mono">/ 100</span>
              </div>

              {/* Contributing Rule-Based Factors */}
              <div className="pt-3 border-t border-white/5 space-y-2">
                <div className="text-[9px] uppercase font-bold text-white/40 tracking-[0.2em]">
                  Contributing Factors
                </div>
                {selectedEntityDetails.risk.factors.map((factor, i) => (
                  <div key={i} className="text-xs bg-white/[0.01] p-2.5 rounded-sm border border-white/5">
                    <div className="flex items-center justify-between text-white font-serif">
                      <span>{factor.name}</span>
                      <span className="text-[#c5a059] font-mono text-[10px]">
                        +{factor.scoreContribution} pts
                      </span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1 leading-relaxed">
                      {factor.detail}
                    </p>
                    {factor.evidenceRef && (
                      <span className="inline-block mt-1 text-[8px] px-1.5 py-0.5 rounded-sm bg-white/[0.03] text-white/50 font-mono border border-white/5">
                        Exhibit: {factor.evidenceRef}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions for this Entity */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-node-multihop"
                onClick={() => {
                  setIsMultiHopOpen(true);
                }}
                className="p-2.5 rounded-sm border border-[#c5a059]/40 hover:bg-[#c5a059]/10 text-[#c5a059] text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Network className="w-3.5 h-3.5" />
                <span>Multi-Hop</span>
              </button>
              <button
                id="btn-node-expand-2hop"
                onClick={() => {
                  if (selectedEntityId) {
                    runNeighborhoodDiscovery(selectedEntityId, 2);
                  }
                }}
                className="p-2.5 rounded-sm border border-white/10 hover:border-[#c5a059]/40 text-white/80 text-[10px] uppercase tracking-wider font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-[#c5a059]" />
                <span>Expand 2-Hops</span>
              </button>
            </div>

            {/* Properties Table */}
            <div>
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-[0.2em] block mb-2">
                Entity Metadata
              </span>
              <div className="rounded-sm bg-white/[0.01] border border-white/5 divide-y divide-white/5 text-xs">
                {Object.entries(selectedEntityDetails.entity.properties).map(([key, val]) => (
                  <div key={key} className="px-3 py-2 flex items-center justify-between">
                    <span className="text-white/40 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    <span className="text-white/80 font-mono font-medium truncate max-w-[180px]">
                      {String(val)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Connected Relationships */}
            <div>
              <span className="text-[9px] uppercase font-bold text-white/40 tracking-[0.2em] block mb-2">
                Associative Links ({selectedEntityDetails.relationships.length})
              </span>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {selectedEntityDetails.relationships.map((rel) => {
                  const otherId = rel.source === selectedEntityDetails.entity.id ? rel.target : rel.source;
                  const otherEntity = entities.find((e) => e.id === otherId);
                  return (
                    <button
                      key={rel.id}
                      onClick={() => setSelectedEntityId(otherId)}
                      className="w-full p-2.5 rounded-sm bg-white/[0.01] border border-white/5 hover:border-[#c5a059]/40 text-left flex items-center justify-between group transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="text-xs font-serif text-white group-hover:text-[#c5a059] transition-colors">
                          {otherEntity ? otherEntity.name : otherId}
                        </div>
                        <div className="text-[9px] text-white/40 font-mono">
                          {rel.type} {rel.label ? `• ${rel.label}` : ''}
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-white/30 group-hover:text-[#c5a059]" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direct Timeline Events */}
            {selectedEntityDetails.events.length > 0 && (
              <div>
                <span className="text-[9px] uppercase font-bold text-white/40 tracking-[0.2em] block mb-2">
                  Temporal Incidents ({selectedEntityDetails.events.length})
                </span>
                <div className="space-y-2">
                  {selectedEntityDetails.events.map((ev) => (
                    <div key={ev.id} className="p-2.5 rounded-sm bg-white/[0.01] border border-white/5 text-xs">
                      <div className="flex items-center justify-between text-[9px] text-white/40 font-mono">
                        <span>{new Date(ev.timestamp).toLocaleString()}</span>
                        <span className="px-1.5 py-0.2 rounded-sm bg-white/[0.03] text-[#c5a059]">{ev.type}</span>
                      </div>
                      <p className="text-white font-serif text-sm mt-1">{ev.title}</p>
                      <p className="text-[10px] text-white/40 mt-0.5 leading-relaxed">{ev.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>
      )}
    </div>
  );
};
