import { create } from 'zustand';
import {
  CaseRecord,
  EvidenceRecord,
  POLEEntity,
  GraphData,
  CentralityMetric,
  ShortestPathResult,
  MultiHopResult,
  NeighborhoodResult,
  InvestigationEvent,
  RiskAssessment,
  ChatMessage,
  DashboardStats,
} from '../types.js';
import { InvestigationApi } from '../api/client.js';

export type NavigationTab =
  | 'dashboard'
  | 'cases'
  | 'evidence'
  | 'network'
  | 'timeline'
  | 'entities'
  | 'risk'
  | 'chat'
  | 'verify'
  | 'settings';

interface InvestigationStore {
  // Navigation
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;

  // Active Case
  activeCaseId: string;
  setActiveCaseId: (caseId: string) => void;

  // Data
  cases: CaseRecord[];
  graphData: GraphData;
  entities: POLEEntity[];
  evidence: EvidenceRecord[];
  timeline: InvestigationEvent[];
  stats: DashboardStats | null;
  centralityMetrics: CentralityMetric[];

  // Selected Node / Details
  selectedEntityId: string | null;
  selectedEntityDetails: {
    entity: POLEEntity;
    risk: RiskAssessment;
    relationships: any[];
    events: any[];
  } | null;
  setSelectedEntityId: (id: string | null) => Promise<void>;

  // Graph highlights & BFS
  highlightedNodeIds: string[];
  highlightedEdgeIds: string[];
  setHighlights: (nodeIds: string[], edgeIds?: string[]) => void;
  clearHighlights: () => void;

  // Shortest Path & Multi-Hop Analysis
  isShortestPathOpen: boolean;
  setIsShortestPathOpen: (open: boolean) => void;
  shortestPathResult: ShortestPathResult | null;
  runShortestPath: (sourceId: string, targetId: string) => Promise<void>;
  clearShortestPath: () => void;

  isMultiHopOpen: boolean;
  setIsMultiHopOpen: (open: boolean) => void;
  multiHopResult: MultiHopResult | null;
  selectedMultiHopIndex: number | null;
  runMultiHopAnalysis: (sourceId: string, targetId: string, maxHops?: number) => Promise<void>;
  selectMultiHopPath: (index: number | null) => void;
  clearMultiHop: () => void;

  // N-Hop Neighborhood
  neighborhoodResult: NeighborhoodResult | null;
  focalEntityId: string | null;
  activeHopDepth: number | 'ALL';
  runNeighborhoodDiscovery: (entityId: string, maxHops?: number) => Promise<void>;
  setActiveHopDepth: (depth: number | 'ALL') => void;
  clearNeighborhood: () => void;

  // Verification
  selectedEvidenceForVerify: string | null;
  setSelectedEvidenceForVerify: (id: string | null) => void;
  verificationResult: any | null;
  verifySelectedEvidence: (evidenceId: string) => Promise<void>;
  simulateTamper: (evidenceId: string) => Promise<void>;
  restoreEvidence: (evidenceId: string) => Promise<void>;

  // Chat
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  sendChatMessage: (query: string) => Promise<void>;
  clearChat: () => void;

  // Filter & Search
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterEntityType: string;
  setFilterEntityType: (t: string) => void;
  filterRiskLevel: string;
  setFilterRiskLevel: (r: string) => void;

  // Loaders
  isLoading: boolean;
  error: string | null;
  refreshAllData: () => Promise<void>;
  restoreDemoIntelligence: () => Promise<void>;
}

export const useInvestigationStore = create<InvestigationStore>((set, get) => ({
  activeTab: 'dashboard',
  setActiveTab: (tab) => set({ activeTab: tab }),

  activeCaseId: 'CASE-001',
  setActiveCaseId: (caseId) => {
    set({ activeCaseId: caseId });
    get().refreshAllData();
  },

  cases: [],
  graphData: { nodes: [], edges: [] },
  entities: [],
  evidence: [],
  timeline: [],
  stats: null,
  centralityMetrics: [],

  selectedEntityId: null,
  selectedEntityDetails: null,
  setSelectedEntityId: async (id) => {
    set({ selectedEntityId: id });
    if (!id) {
      set({ selectedEntityDetails: null });
      return;
    }
    try {
      const details = await InvestigationApi.getEntityById(id);
      set({ selectedEntityDetails: details });
    } catch (err: any) {
      console.error('Failed to load entity details', err);
    }
  },

  highlightedNodeIds: [],
  highlightedEdgeIds: [],
  setHighlights: (nodeIds, edgeIds = []) => {
    set({ highlightedNodeIds: nodeIds, highlightedEdgeIds: edgeIds });
  },
  clearHighlights: () => set({ highlightedNodeIds: [], highlightedEdgeIds: [] }),

  isShortestPathOpen: false,
  setIsShortestPathOpen: (open) => set({ isShortestPathOpen: open }),
  shortestPathResult: null,
  runShortestPath: async (sourceId, targetId) => {
    set({ isLoading: true, error: null });
    try {
      const result = await InvestigationApi.getShortestPath(sourceId, targetId, get().activeCaseId);
      set({
        shortestPathResult: result,
        highlightedNodeIds: result.nodeIds,
        highlightedEdgeIds: result.edgeIds,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  clearShortestPath: () => {
    set({ shortestPathResult: null });
    get().clearHighlights();
  },

  isMultiHopOpen: false,
  setIsMultiHopOpen: (open) => set({ isMultiHopOpen: open }),
  multiHopResult: null,
  selectedMultiHopIndex: null,
  runMultiHopAnalysis: async (sourceId, targetId, maxHops = 4) => {
    set({ isLoading: true, error: null });
    try {
      const result = await InvestigationApi.getMultiHopPaths(sourceId, targetId, get().activeCaseId, maxHops);
      set({
        multiHopResult: result,
        selectedMultiHopIndex: result.paths.length > 0 ? 0 : null,
        highlightedNodeIds: result.paths.length > 0 ? result.paths[0].nodeIds : result.allNodeIds,
        highlightedEdgeIds: result.paths.length > 0 ? result.paths[0].edgeIds : result.allEdgeIds,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  selectMultiHopPath: (index) => {
    const { multiHopResult } = get();
    if (!multiHopResult) return;

    if (index === null) {
      // Highlight all discovered paths concurrently
      set({
        selectedMultiHopIndex: null,
        highlightedNodeIds: multiHopResult.allNodeIds,
        highlightedEdgeIds: multiHopResult.allEdgeIds,
      });
      return;
    }

    const path = multiHopResult.paths[index];
    if (path) {
      set({
        selectedMultiHopIndex: index,
        highlightedNodeIds: path.nodeIds,
        highlightedEdgeIds: path.edgeIds,
      });
    }
  },
  clearMultiHop: () => {
    set({ multiHopResult: null, selectedMultiHopIndex: null });
    get().clearHighlights();
  },

  neighborhoodResult: null,
  focalEntityId: null,
  activeHopDepth: 'ALL',
  runNeighborhoodDiscovery: async (entityId, maxHops = 2) => {
    set({ isLoading: true, error: null, focalEntityId: entityId });
    try {
      const result = await InvestigationApi.getNeighborhood(entityId, get().activeCaseId, maxHops);
      set({
        neighborhoodResult: result,
        activeHopDepth: maxHops,
        highlightedNodeIds: result.allNodeIds,
        highlightedEdgeIds: result.allEdgeIds,
        isLoading: false,
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  setActiveHopDepth: (depth) => {
    const { neighborhoodResult } = get();
    set({ activeHopDepth: depth });

    if (!neighborhoodResult) return;

    if (depth === 'ALL') {
      set({
        highlightedNodeIds: neighborhoodResult.allNodeIds,
        highlightedEdgeIds: neighborhoodResult.allEdgeIds,
      });
      return;
    }

    // Collect all nodes up to depth
    const nodeIds: string[] = [];
    for (let h = 0; h <= depth; h++) {
      const nodes = neighborhoodResult.nodesByHop[h] || [];
      nodes.forEach((n) => nodeIds.push(n.entityId));
    }

    set({
      highlightedNodeIds: nodeIds,
      // Keep edges that connect to these nodes
      highlightedEdgeIds: neighborhoodResult.allEdgeIds,
    });
  },
  clearNeighborhood: () => {
    set({ neighborhoodResult: null, focalEntityId: null, activeHopDepth: 'ALL' });
    get().clearHighlights();
  },

  selectedEvidenceForVerify: 'EV-001',
  setSelectedEvidenceForVerify: (id) => set({ selectedEvidenceForVerify: id, verificationResult: null }),
  verificationResult: null,
  verifySelectedEvidence: async (evidenceId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await InvestigationApi.verifyEvidence(evidenceId);
      set({ verificationResult: res, isLoading: false });
      // Refresh evidence records list to show status change
      const list = await InvestigationApi.getEvidenceList(get().activeCaseId);
      set({ evidence: list });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  simulateTamper: async (evidenceId) => {
    set({ isLoading: true, error: null });
    try {
      await InvestigationApi.tamperTest(evidenceId);
      // Immediately run verification to catch the hash mismatch
      await get().verifySelectedEvidence(evidenceId);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },
  restoreEvidence: async (evidenceId) => {
    set({ isLoading: true, error: null });
    try {
      await InvestigationApi.restoreEvidence(evidenceId);
      await get().verifySelectedEvidence(evidenceId);
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  chatMessages: [
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'CrimeNet Investigation Assistant initialized. Ask questions regarding suspects, accounts, CDR burst activity, wire transfers, shortest paths, or location overlaps.',
      timestamp: new Date().toISOString(),
      source: 'RULE_PARSER',
    },
  ],
  isChatLoading: false,
  sendChatMessage: async (query) => {
    const userMsg: ChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toISOString(),
    };

    set((state) => ({
      chatMessages: [...state.chatMessages, userMsg],
      isChatLoading: true,
    }));

    try {
      const response = await InvestigationApi.sendChatQuery(query, get().activeCaseId);
      set((state) => ({
        chatMessages: [...state.chatMessages, response],
        isChatLoading: false,
      }));

      // If query returned highlighted nodes, apply them to network
      if (response.highlightNodeIds && response.highlightNodeIds.length > 0) {
        get().setHighlights(response.highlightNodeIds);
      }
    } catch (err: any) {
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        sender: 'assistant',
        text: `Error executing query: ${err.message}`,
        timestamp: new Date().toISOString(),
        source: 'RULE_PARSER',
      };
      set((state) => ({
        chatMessages: [...state.chatMessages, errMsg],
        isChatLoading: false,
      }));
    }
  },
  clearChat: () => {
    set({
      chatMessages: [
        {
          id: `welcome_${Date.now()}`,
          sender: 'assistant',
          text: 'Investigation chat reset. Enter queries below or select quick prompt directives.',
          timestamp: new Date().toISOString(),
          source: 'RULE_PARSER',
        },
      ],
    });
  },

  searchQuery: '',
  setSearchQuery: (q) => set({ searchQuery: q }),
  filterEntityType: 'ALL',
  setFilterEntityType: (t) => set({ filterEntityType: t }),
  filterRiskLevel: 'ALL',
  setFilterRiskLevel: (r) => set({ filterRiskLevel: r }),

  isLoading: false,
  error: null,

  refreshAllData: async () => {
    set({ isLoading: true, error: null });
    const caseId = get().activeCaseId;
    try {
      const [cases, stats, graph, entities, evidence, timeline, centrality] = await Promise.all([
        InvestigationApi.getCases(),
        InvestigationApi.getStats(caseId),
        InvestigationApi.getGraph(caseId),
        InvestigationApi.getEntities({ caseId }),
        InvestigationApi.getEvidenceList(caseId),
        InvestigationApi.getTimeline({ caseId }),
        InvestigationApi.getCentrality(caseId),
      ]);

      set({
        cases,
        stats,
        graphData: graph,
        entities,
        evidence,
        timeline,
        centralityMetrics: centrality,
        isLoading: false,
      });
    } catch (err: any) {
      console.error('Failed to refresh data', err);
      set({ error: err.message, isLoading: false });
    }
  },

  restoreDemoIntelligence: async () => {
    set({ isLoading: true, error: null });
    try {
      await InvestigationApi.resetDemoData();
      await get().refreshAllData();
    } catch (err: any) {
      console.error('Failed to reset demo intelligence data', err);
      set({ error: err.message, isLoading: false });
    }
  },
}));
