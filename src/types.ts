export type PoleType = 'PERSON' | 'OBJECT' | 'LOCATION' | 'EVENT';

export type EntitySubtype =
  | 'PERSON'
  | 'PHONE'
  | 'BANK_ACCOUNT'
  | 'VEHICLE'
  | 'IP_ADDRESS'
  | 'LOCATION'
  | 'EVENT'
  | 'FIREARM';

export type RelationshipType =
  | 'CALLED'
  | 'TRANSFERRED'
  | 'USED'
  | 'LOCATED_AT'
  | 'VISITED'
  | 'CONNECTED_TO'
  | 'REGISTERED_TO'
  | 'INVOLVED_IN'
  | 'ASSOCIATE_OF'
  | 'OWNED_BY';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface EntityProperty {
  [key: string]: any;
}

export interface POLEEntity {
  id: string;
  name: string;
  poleType: PoleType;
  type: EntitySubtype;
  riskScore: number;
  riskLevel: RiskLevel;
  properties: EntityProperty;
  evidenceIds: string[];
  caseId: string;
  createdAt: string;
}

export interface POLERelationship {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  timestamp?: string;
  evidenceId?: string;
  details?: string;
  amount?: number;
  duration?: number;
}

export interface InvestigationEvent {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  sourceEntityId: string;
  targetEntityId?: string;
  locationId?: string;
  evidenceId?: string;
  caseId: string;
  metadata?: Record<string, any>;
}

export interface CaseRecord {
  id: string;
  title: string;
  description: string;
  status: 'OPEN' | 'UNDER_INVESTIGATION' | 'CLOSED' | 'ARCHIVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  leadInvestigator: string;
  createdDate: string;
  updatedDate: string;
  evidenceCount: number;
  entityCount: number;
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  fileName: string;
  fileType: 'CDR_CSV' | 'BANK_CSV' | 'VEHICLE_CSV' | 'IP_LOG_CSV' | 'FIR_TXT' | 'GENERIC_CSV' | 'GENERIC_TXT' | 'PDF_REPORT';
  fileSize: number;
  uploadDate: string;
  sha256: string;
  originalHash: string;
  status: 'PROCESSED' | 'PENDING' | 'TAMPERED' | 'ERROR';
  verificationStatus?: 'VERIFIED' | 'TAMPERED' | 'UNVERIFIED';
  lastVerifiedDate?: string;
  entitiesExtracted: number;
  relationshipsExtracted: number;
  extractedEntityIds: string[];
  notes?: string;
  pageCount?: number;
  ocrApplied?: boolean;
  extractedTextSnippet?: string;
  pdfMetadata?: Record<string, any>;
}

export interface CytoscapeNodeData {
  id: string;
  label: string;
  poleType: PoleType;
  type: EntitySubtype;
  riskScore: number;
  riskLevel: RiskLevel;
  degree?: number;
  pageRank?: number;
  properties?: Record<string, any>;
}

export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  type: RelationshipType;
  label?: string;
  timestamp?: string;
  evidenceId?: string;
  details?: string;
  amount?: number;
}

export interface GraphData {
  nodes: Array<{ data: CytoscapeNodeData }>;
  edges: Array<{ data: CytoscapeEdgeData }>;
}

export interface CentralityMetric {
  entityId: string;
  entityName: string;
  type: EntitySubtype;
  poleType: PoleType;
  connections: number;
  degreeCentrality: number;
  pageRank: number;
  riskScore: number;
  riskLevel: RiskLevel;
}

export interface ShortestPathResult {
  found: boolean;
  source: string;
  target: string;
  hops: number;
  path: Array<{ entityId: string; entityName: string; type: string; poleType: PoleType }>;
  relationships: Array<{ from: string; to: string; type: string; id: string }>;
  nodeIds: string[];
  edgeIds: string[];
}

export interface MultiHopPath {
  hops: number;
  path: Array<{ entityId: string; entityName: string; type: string; poleType: PoleType }>;
  relationships: Array<{ from: string; to: string; type: string; id: string; label?: string }>;
  nodeIds: string[];
  edgeIds: string[];
}

export interface MultiHopResult {
  found: boolean;
  source: string;
  target: string;
  minHops: number;
  maxHopsSearched: number;
  totalPathsFound: number;
  paths: MultiHopPath[];
  allNodeIds: string[];
  allEdgeIds: string[];
}

export interface NeighborhoodHopNode {
  entityId: string;
  entityName: string;
  type: string;
  poleType: PoleType;
  hopDistance: number;
  riskScore: number;
  riskLevel: RiskLevel;
  directDegree: number;
}

export interface NeighborhoodResult {
  centerEntityId: string;
  centerEntityName: string;
  maxHops: number;
  totalNodes: number;
  totalEdges: number;
  nodesByHop: Record<number, NeighborhoodHopNode[]>;
  allNodeIds: string[];
  allEdgeIds: string[];
}

export interface RiskFactor {
  name: string;
  scoreContribution: number;
  detail: string;
  evidenceRef?: string;
}

export interface RiskAssessment {
  entityId: string;
  entityName: string;
  type: EntitySubtype;
  score: number;
  level: RiskLevel;
  reasons: string[];
  factors: RiskFactor[];
  lastCalculated: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  source?: 'RULE_PARSER' | 'GEMINI_AI';
  dataSnapshot?: any;
  highlightNodeIds?: string[];
}

export interface DashboardStats {
  totalCases: number;
  totalEntities: number;
  personsCount: number;
  objectsCount: number;
  locationsCount: number;
  eventsCount: number;
  connectionsCount: number;
  highRiskCount: number;
  evidenceFilesCount: number;
  suspiciousTransactionsCount: number;
  riskDistribution: { low: number; medium: number; high: number; critical: number };
  entityTypeDistribution: Record<string, number>;
  relationshipDistribution: Record<string, number>;
}
