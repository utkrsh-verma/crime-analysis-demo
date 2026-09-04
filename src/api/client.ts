import axios from 'axios';
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

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const InvestigationApi = {
  // Stats
  getStats: async (caseId?: string): Promise<DashboardStats> => {
    const res = await api.get<DashboardStats>('/stats', { params: { caseId } });
    return res.data;
  },

  // Cases
  getCases: async (): Promise<CaseRecord[]> => {
    const res = await api.get<CaseRecord[]>('/cases');
    return res.data;
  },

  getCaseById: async (id: string): Promise<CaseRecord> => {
    const res = await api.get<CaseRecord>(`/cases/${id}`);
    return res.data;
  },

  createCase: async (payload: {
    title: string;
    description: string;
    priority?: string;
    leadInvestigator?: string;
  }): Promise<CaseRecord> => {
    const res = await api.post<CaseRecord>('/cases', payload);
    return res.data;
  },

  // Evidence
  getEvidenceList: async (caseId?: string): Promise<EvidenceRecord[]> => {
    const res = await api.get<EvidenceRecord[]>('/evidence', { params: { caseId } });
    return res.data;
  },

  uploadEvidence: async (formData: FormData): Promise<{ success: boolean; evidence: EvidenceRecord; extracted: any }> => {
    const res = await api.post('/evidence/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  verifyEvidence: async (evidenceId: string): Promise<{
    evidenceId: string;
    fileName: string;
    verified: boolean;
    originalHash: string;
    currentHash: string;
    status: 'VERIFIED' | 'TAMPERED';
    message: string;
    verifiedAt: string;
    fileSizeBytes: number;
  }> => {
    const res = await api.post('/evidence/verify', { evidenceId });
    return res.data;
  },

  tamperTest: async (evidenceId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/evidence/tamper-test', { evidenceId });
    return res.data;
  },

  restoreEvidence: async (evidenceId: string): Promise<{ success: boolean; message: string }> => {
    const res = await api.post('/evidence/restore', { evidenceId });
    return res.data;
  },

  getSampleFiles: async (): Promise<Array<{ id: string; name: string; type: string; description: string }>> => {
    const res = await api.get('/evidence/samples');
    return res.data;
  },

  loadSampleFile: async (sampleId: string, caseId?: string): Promise<any> => {
    const res = await api.post('/evidence/load-sample', { sampleId, caseId });
    return res.data;
  },

  inspectPdfOcr: async (evidenceId: string): Promise<{
    evidenceId: string;
    fileName: string;
    pageCount: number;
    ocrApplied: boolean;
    rawText: string;
    metadata: Record<string, any>;
    extractedEntitiesCount: number;
    extractedRelationshipsCount: number;
  }> => {
    const res = await api.post('/evidence/ocr-inspect', { evidenceId });
    return res.data;
  },

  // Graph
  getGraph: async (caseId?: string): Promise<GraphData> => {
    const res = await api.get<GraphData>('/graph', { params: { caseId } });
    return res.data;
  },

  // Centrality & PageRank
  getCentrality: async (caseId?: string): Promise<CentralityMetric[]> => {
    const res = await api.get<CentralityMetric[]>('/graph/centrality', { params: { caseId } });
    return res.data;
  },

  // Shortest Path (BFS)
  getShortestPath: async (source: string, target: string, caseId?: string): Promise<ShortestPathResult> => {
    const res = await api.get<ShortestPathResult>('/graph/shortest-path', {
      params: { source, target, caseId },
    });
    return res.data;
  },

  // Multi-Hop Path Analysis (All paths up to N hops)
  getMultiHopPaths: async (
    source: string,
    target: string,
    caseId?: string,
    maxHops: number = 4,
    maxPaths: number = 15
  ): Promise<MultiHopResult> => {
    const res = await api.get<MultiHopResult>('/graph/multi-hop-paths', {
      params: { source, target, caseId, maxHops, maxPaths },
    });
    return res.data;
  },

  // N-Hop Neighborhood Discovery
  getNeighborhood: async (
    entityId: string,
    caseId?: string,
    maxHops: number = 2
  ): Promise<NeighborhoodResult> => {
    const res = await api.get<NeighborhoodResult>('/graph/neighborhood', {
      params: { entityId, caseId, maxHops },
    });
    return res.data;
  },

  // Entities
  getEntities: async (params?: {
    caseId?: string;
    poleType?: string;
    type?: string;
    riskLevel?: string;
    search?: string;
  }): Promise<POLEEntity[]> => {
    const res = await api.get<POLEEntity[]>('/entities', { params });
    return res.data;
  },

  getEntityById: async (id: string): Promise<{
    entity: POLEEntity;
    risk: RiskAssessment;
    relationships: any[];
    events: any[];
  }> => {
    const res = await api.get(`/entities/${id}`);
    return res.data;
  },

  // Timeline
  getTimeline: async (params?: { caseId?: string; entityId?: string; type?: string }): Promise<InvestigationEvent[]> => {
    const res = await api.get<InvestigationEvent[]>('/timeline', { params });
    return res.data;
  },

  // Explainable AI Risk Score
  getRiskAssessment: async (entityId: string): Promise<RiskAssessment> => {
    const res = await api.get<RiskAssessment>(`/risk/${entityId}`);
    return res.data;
  },

  // Investigation Chat
  sendChatQuery: async (query: string, caseId?: string): Promise<ChatMessage> => {
    const res = await api.post<ChatMessage>('/chat/query', { query, caseId });
    return res.data;
  },

  // Reset / Re-seed Demo Intelligence Data
  resetDemoData: async (): Promise<{ success: boolean; message: string; casesCount: number; entitiesCount: number; evidenceCount: number }> => {
    const res = await api.post('/admin/reset-demo');
    return res.data;
  },
};
