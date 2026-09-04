import {
  POLEEntity,
  POLERelationship,
  InvestigationEvent,
  RiskAssessment,
  RiskFactor,
  RiskLevel,
} from '../types.js';
import { GraphAnalytics } from './graphAnalytics.js';

export class RiskEngine {
  /**
   * Determine categorical risk level from numerical 0-100 score
   */
  public static getRiskLevel(score: number): RiskLevel {
    if (score >= 81) return 'CRITICAL';
    if (score >= 61) return 'HIGH';
    if (score >= 31) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Evaluates transparent, rule-based risk factors for an entity
   */
  public static evaluateEntityRisk(
    entity: POLEEntity,
    allEntities: POLEEntity[],
    relationships: POLERelationship[],
    events: InvestigationEvent[]
  ): RiskAssessment {
    const factors: RiskFactor[] = [];
    const reasons: string[] = [];

    // Find all directly connected relationships
    const directRel = relationships.filter(
      (r) => r.source === entity.id || r.target === entity.id
    );

    // Find all directly connected events
    const directEvents = events.filter(
      (ev) =>
        ev.sourceEntityId === entity.id ||
        ev.targetEntityId === entity.id ||
        ev.locationId === entity.id
    );

    let calculatedScore = 15; // Baseline presence

    // Factor 1: High Number of Network Connections
    const connectionCount = directRel.length;
    if (connectionCount >= 10) {
      calculatedScore += 25;
      factors.push({
        name: 'High Network Density',
        scoreContribution: 25,
        detail: `${connectionCount} active criminal network connections identified across CDR, banking, and field surveillance.`,
      });
      reasons.push(`${connectionCount} network connections detected across multiple operational nodes`);
    } else if (connectionCount >= 5) {
      calculatedScore += 15;
      factors.push({
        name: 'Elevated Network Connections',
        scoreContribution: 15,
        detail: `${connectionCount} connections linked to other persons, objects, or locations.`,
      });
      reasons.push(`${connectionCount} multi-vector connections identified in evidence`);
    } else if (connectionCount >= 2) {
      calculatedScore += 8;
      factors.push({
        name: 'Active Association Hub',
        scoreContribution: 8,
        detail: `${connectionCount} direct associations established.`,
      });
    }

    // Factor 2: High Financial Value & Mule Transactions (> ₹1,00,000)
    const transfers = directRel.filter((r) => r.type === 'TRANSFERRED' || r.amount);
    const highValTransfers = transfers.filter((t) => (t.amount || 0) >= 100000);
    const totalAmount = transfers.reduce((acc, t) => acc + (t.amount || 0), 0);

    if (highValTransfers.length > 0) {
      const contribution = Math.min(30, 15 + highValTransfers.length * 5);
      calculatedScore += contribution;
      factors.push({
        name: 'High-Value Financial Flow',
        scoreContribution: contribution,
        detail: `Associated with ₹${totalAmount.toLocaleString('en-IN')} across ${transfers.length} transfers (${highValTransfers.length} exceed FIU threshold of ₹1,00,000).`,
        evidenceRef: highValTransfers[0]?.evidenceId || 'EV-002',
      });
      reasons.push(`High-value transaction detected: ₹${totalAmount.toLocaleString('en-IN')} across ${transfers.length} wires`);
    }

    // Factor 3: Call Bursts / High Frequency Cellular Intercepts
    const calls = directRel.filter((r) => r.type === 'CALLED');
    if (calls.length >= 4) {
      calculatedScore += 18;
      factors.push({
        name: 'Telephonic Burst Coordination',
        scoreContribution: 18,
        detail: `${calls.length} intercepted calls indicative of rapid tactical syndicate coordination.`,
        evidenceRef: calls[0]?.evidenceId || 'EV-001',
      });
      reasons.push(`Telephonic burst activity: ${calls.length} calls logged within critical operational windows`);
    } else if (calls.length >= 2) {
      calculatedScore += 8;
      factors.push({
        name: 'Frequent Telephonic Contact',
        scoreContribution: 8,
        detail: `${calls.length} intercepted calls.`,
      });
    }

    // Factor 4: Spatial Overlap & Location Co-presence
    const locationRels = directRel.filter((r) => r.type === 'LOCATED_AT' || r.type === 'VISITED');
    const towerEvents = directEvents.filter((e) => e.metadata?.tower || e.locationId === 'LOC01');
    if (locationRels.length >= 2 || towerEvents.length >= 1) {
      calculatedScore += 15;
      factors.push({
        name: 'Spatial Co-location Hotspot',
        scoreContribution: 15,
        detail: `Repeated spatial overlap logged at primary syndicate hubs (e.g., Tower 45 Cyber City / Warehouse 12).`,
        evidenceRef: 'EV-001 / EV-003',
      });
      reasons.push('Same tower location and physical perimeter overlap detected');
    }

    // Factor 5: Network Centrality & PageRank
    const centralityList = GraphAnalytics.calculateCentralityMetrics(allEntities, relationships);
    const metric = centralityList.find((m) => m.entityId === entity.id);
    if (metric && metric.degreeCentrality >= 0.15) {
      calculatedScore += 12;
      factors.push({
        name: 'High Graph Centrality & Influence',
        scoreContribution: 12,
        detail: `Degree Centrality is ${(metric.degreeCentrality * 100).toFixed(1)}% with PageRank ${metric.pageRank}. Functions as a key structural bridge.`,
      });
      reasons.push('High network centrality: functions as a critical bridge between sub-clusters');
    }

    // Factor 6: Direct Linkage to Known Kingpin or High Risk Person
    const associates = directRel.filter((r) => r.type === 'ASSOCIATE_OF' || r.type === 'INVOLVED_IN');
    const linksToP001 = directRel.some((r) => r.source === 'P001' || r.target === 'P001');
    if (entity.id !== 'P001' && linksToP001) {
      calculatedScore += 10;
      factors.push({
        name: 'Direct Syndicate Kingpin Nexus',
        scoreContribution: 10,
        detail: `Direct associate relationship to mastermind P001 (Utkarsh Verma).`,
        evidenceRef: 'EV-004',
      });
      reasons.push('Direct nexus to identified syndicate mastermind Utkarsh Verma');
    } else if (associates.length > 0) {
      calculatedScore += 6;
      factors.push({
        name: 'Documented Criminal Association',
        scoreContribution: 6,
        detail: `${associates.length} explicit conspiracy / associate edges mapped.`,
      });
    }

    // Factor 7: Cyber Anonymization / Bulletproof IP Gateway
    const ipConnections = directRel.filter((r) => r.source === 'IP01' || r.target === 'IP01');
    if (ipConnections.length > 0 || entity.id === 'IP01') {
      calculatedScore += 12;
      factors.push({
        name: 'Encrypted Anonymization Proxy Node',
        scoreContribution: 12,
        detail: 'Authentication or routing through bulletproof offshore VPN gateway IP01 (185.220.101.45).',
        evidenceRef: 'EV-004',
      });
      reasons.push('Anonymized cyber infrastructure usage: bulletproof VPN / proxy routing verified');
    }

    // Bound score within 0 - 100
    const finalScore = Math.min(99, Math.max(12, calculatedScore));
    const level = this.getRiskLevel(finalScore);

    if (reasons.length === 0) {
      reasons.push('Standard entity node with minimal suspicious activity logged');
    }

    return {
      entityId: entity.id,
      entityName: entity.name,
      type: entity.type,
      score: finalScore,
      level,
      reasons,
      factors,
      lastCalculated: new Date().toISOString(),
    };
  }
}
