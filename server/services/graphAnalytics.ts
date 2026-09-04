import {
  POLEEntity,
  POLERelationship,
  CentralityMetric,
  ShortestPathResult,
  MultiHopResult,
  MultiHopPath,
  NeighborhoodResult,
  NeighborhoodHopNode,
  GraphData,
} from '../types.js';

export class GraphAnalytics {
  /**
   * Run real BFS algorithm to find the shortest path between two entities
   */
  public static findShortestPath(
    sourceId: string,
    targetId: string,
    entities: POLEEntity[],
    relationships: POLERelationship[]
  ): ShortestPathResult {
    const entityMap = new Map<string, POLEEntity>();
    entities.forEach((e) => entityMap.set(e.id, e));

    if (!entityMap.has(sourceId) || !entityMap.has(targetId)) {
      return {
        found: false,
        source: sourceId,
        target: targetId,
        hops: 0,
        path: [],
        relationships: [],
        nodeIds: [],
        edgeIds: [],
      };
    }

    if (sourceId === targetId) {
      const e = entityMap.get(sourceId)!;
      return {
        found: true,
        source: sourceId,
        target: targetId,
        hops: 0,
        path: [{ entityId: e.id, entityName: e.name, type: e.type, poleType: e.poleType }],
        relationships: [],
        nodeIds: [sourceId],
        edgeIds: [],
      };
    }

    // Build adjacency list with edge metadata
    const adj = new Map<string, Array<{ neighbor: string; edge: POLERelationship }>>();
    entities.forEach((e) => adj.set(e.id, []));

    relationships.forEach((rel) => {
      if (!adj.has(rel.source)) adj.set(rel.source, []);
      if (!adj.has(rel.target)) adj.set(rel.target, []);

      adj.get(rel.source)!.push({ neighbor: rel.target, edge: rel });
      // Undirected graph traversal for criminal relationship network connection discovery
      adj.get(rel.target)!.push({ neighbor: rel.source, edge: rel });
    });

    const queue: string[] = [sourceId];
    const visited = new Set<string>([sourceId]);
    const parentMap = new Map<string, { parent: string; edge: POLERelationship }>();

    let found = false;

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === targetId) {
        found = true;
        break;
      }

      const neighbors = adj.get(current) || [];
      for (const { neighbor, edge } of neighbors) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          parentMap.set(neighbor, { parent: current, edge });
          queue.push(neighbor);
        }
      }
    }

    if (!found) {
      return {
        found: false,
        source: sourceId,
        target: targetId,
        hops: 0,
        path: [],
        relationships: [],
        nodeIds: [],
        edgeIds: [],
      };
    }

    // Reconstruct path backwards
    const nodeSequence: string[] = [];
    const edgeSequence: POLERelationship[] = [];
    let curr = targetId;

    nodeSequence.unshift(curr);
    while (curr !== sourceId) {
      const step = parentMap.get(curr);
      if (!step) break;
      edgeSequence.unshift(step.edge);
      curr = step.parent;
      nodeSequence.unshift(curr);
    }

    const pathEntities = nodeSequence.map((id) => {
      const e = entityMap.get(id);
      return {
        entityId: id,
        entityName: e ? e.name : id,
        type: e ? e.type : 'UNKNOWN',
        poleType: e ? e.poleType : 'OBJECT',
      };
    });

    const pathRelationships = edgeSequence.map((e) => ({
      from: e.source,
      to: e.target,
      type: e.type,
      id: e.id,
    }));

    return {
      found: true,
      source: sourceId,
      target: targetId,
      hops: edgeSequence.length,
      path: pathEntities,
      relationships: pathRelationships,
      nodeIds: nodeSequence,
      edgeIds: edgeSequence.map((e) => e.id),
    };
  }

  /**
   * Discovers ALL multi-hop paths between two entities up to maxHops (e.g. 1-hop, 2-hops, 3-hops, 4-hops)
   */
  public static findMultiHopPaths(
    sourceId: string,
    targetId: string,
    entities: POLEEntity[],
    relationships: POLERelationship[],
    maxHops: number = 4,
    maxPaths: number = 20
  ): MultiHopResult {
    const entityMap = new Map<string, POLEEntity>();
    entities.forEach((e) => entityMap.set(e.id, e));

    if (!entityMap.has(sourceId) || !entityMap.has(targetId)) {
      return {
        found: false,
        source: sourceId,
        target: targetId,
        minHops: 0,
        maxHopsSearched: maxHops,
        totalPathsFound: 0,
        paths: [],
        allNodeIds: [],
        allEdgeIds: [],
      };
    }

    if (sourceId === targetId) {
      const e = entityMap.get(sourceId)!;
      return {
        found: true,
        source: sourceId,
        target: targetId,
        minHops: 0,
        maxHopsSearched: maxHops,
        totalPathsFound: 1,
        paths: [
          {
            hops: 0,
            path: [{ entityId: e.id, entityName: e.name, type: e.type, poleType: e.poleType }],
            relationships: [],
            nodeIds: [sourceId],
            edgeIds: [],
          },
        ],
        allNodeIds: [sourceId],
        allEdgeIds: [],
      };
    }

    // Build bidirectional adjacency list
    const adj = new Map<string, Array<{ neighbor: string; edge: POLERelationship }>>();
    entities.forEach((e) => adj.set(e.id, []));

    relationships.forEach((rel) => {
      if (!adj.has(rel.source)) adj.set(rel.source, []);
      if (!adj.has(rel.target)) adj.set(rel.target, []);

      adj.get(rel.source)!.push({ neighbor: rel.target, edge: rel });
      adj.get(rel.target)!.push({ neighbor: rel.source, edge: rel });
    });

    const discoveredPaths: MultiHopPath[] = [];
    const allNodeIdsSet = new Set<string>();
    const allEdgeIdsSet = new Set<string>();

    // DFS with depth bound and cycle prevention
    function dfs(
      currentNode: string,
      currentPath: string[],
      currentEdges: POLERelationship[],
      visitedInBranch: Set<string>
    ) {
      if (currentEdges.length > maxHops) return;
      if (discoveredPaths.length >= maxPaths) return;

      if (currentNode === targetId && currentEdges.length > 0) {
        const pathEntities = currentPath.map((id) => {
          const ent = entityMap.get(id);
          return {
            entityId: id,
            entityName: ent ? ent.name : id,
            type: ent ? ent.type : 'UNKNOWN',
            poleType: ent ? ent.poleType : 'OBJECT',
          };
        });

        const pathEdges = currentEdges.map((e) => ({
          from: e.source,
          to: e.target,
          type: e.type,
          id: e.id,
          label: e.label,
        }));

        currentPath.forEach((n) => allNodeIdsSet.add(n));
        currentEdges.forEach((e) => allEdgeIdsSet.add(e.id));

        discoveredPaths.push({
          hops: currentEdges.length,
          path: pathEntities,
          relationships: pathEdges,
          nodeIds: [...currentPath],
          edgeIds: currentEdges.map((e) => e.id),
        });
        return;
      }

      const neighbors = adj.get(currentNode) || [];
      for (const { neighbor, edge } of neighbors) {
        if (!visitedInBranch.has(neighbor)) {
          visitedInBranch.add(neighbor);
          currentPath.push(neighbor);
          currentEdges.push(edge);

          dfs(neighbor, currentPath, currentEdges, visitedInBranch);

          currentEdges.pop();
          currentPath.pop();
          visitedInBranch.delete(neighbor);
        }
      }
    }

    const branchVisited = new Set<string>([sourceId]);
    dfs(sourceId, [sourceId], [], branchVisited);

    discoveredPaths.sort((a, b) => a.hops - b.hops);

    return {
      found: discoveredPaths.length > 0,
      source: sourceId,
      target: targetId,
      minHops: discoveredPaths.length > 0 ? discoveredPaths[0].hops : 0,
      maxHopsSearched: maxHops,
      totalPathsFound: discoveredPaths.length,
      paths: discoveredPaths,
      allNodeIds: Array.from(allNodeIdsSet),
      allEdgeIds: Array.from(allEdgeIdsSet),
    };
  }

  /**
   * Computes N-Hop neighborhood around a focal entity (ego network)
   */
  public static getNHopNeighborhood(
    centerId: string,
    entities: POLEEntity[],
    relationships: POLERelationship[],
    maxHops: number = 2
  ): NeighborhoodResult {
    const entityMap = new Map<string, POLEEntity>();
    entities.forEach((e) => entityMap.set(e.id, e));

    const centerEntity = entityMap.get(centerId);
    if (!centerEntity) {
      return {
        centerEntityId: centerId,
        centerEntityName: centerId,
        maxHops,
        totalNodes: 0,
        totalEdges: 0,
        nodesByHop: {},
        allNodeIds: [],
        allEdgeIds: [],
      };
    }

    // Adjacency
    const adj = new Map<string, Array<{ neighbor: string; edge: POLERelationship }>>();
    const degreeCount = new Map<string, number>();
    entities.forEach((e) => {
      adj.set(e.id, []);
      degreeCount.set(e.id, 0);
    });

    relationships.forEach((rel) => {
      if (!adj.has(rel.source)) adj.set(rel.source, []);
      if (!adj.has(rel.target)) adj.set(rel.target, []);

      adj.get(rel.source)!.push({ neighbor: rel.target, edge: rel });
      adj.get(rel.target)!.push({ neighbor: rel.source, edge: rel });

      degreeCount.set(rel.source, (degreeCount.get(rel.source) || 0) + 1);
      degreeCount.set(rel.target, (degreeCount.get(rel.target) || 0) + 1);
    });

    const hopDistances = new Map<string, number>();
    hopDistances.set(centerId, 0);

    const queue: Array<{ id: string; hop: number }> = [{ id: centerId, hop: 0 }];
    const allEdgeIdsSet = new Set<string>();

    while (queue.length > 0) {
      const { id, hop } = queue.shift()!;
      if (hop >= maxHops) continue;

      const neighbors = adj.get(id) || [];
      for (const { neighbor, edge } of neighbors) {
        if (!hopDistances.has(neighbor)) {
          hopDistances.set(neighbor, hop + 1);
          queue.push({ id: neighbor, hop: hop + 1 });
        }
      }
    }

    // Collect all edges where both nodes are in the discovered neighborhood
    relationships.forEach((rel) => {
      if (hopDistances.has(rel.source) && hopDistances.has(rel.target)) {
        allEdgeIdsSet.add(rel.id);
      }
    });

    const nodesByHop: Record<number, NeighborhoodHopNode[]> = {};
    for (let h = 0; h <= maxHops; h++) {
      nodesByHop[h] = [];
    }

    hopDistances.forEach((hop, id) => {
      const ent = entityMap.get(id);
      if (ent) {
        nodesByHop[hop].push({
          entityId: ent.id,
          entityName: ent.name,
          type: ent.type,
          poleType: ent.poleType,
          hopDistance: hop,
          riskScore: ent.riskScore,
          riskLevel: ent.riskLevel,
          directDegree: degreeCount.get(ent.id) || 0,
        });
      }
    });

    // Sort nodes in each hop by riskScore descending
    Object.keys(nodesByHop).forEach((key) => {
      nodesByHop[Number(key)].sort((a, b) => b.riskScore - a.riskScore);
    });

    const allNodeIds = Array.from(hopDistances.keys());

    return {
      centerEntityId: centerId,
      centerEntityName: centerEntity.name,
      maxHops,
      totalNodes: allNodeIds.length,
      totalEdges: allEdgeIdsSet.size,
      nodesByHop,
      allNodeIds,
      allEdgeIds: Array.from(allEdgeIdsSet),
    };
  }

  /**
   * Calculate real PageRank scores using power iteration
   */
  public static calculatePageRank(
    entities: POLEEntity[],
    relationships: POLERelationship[],
    dampingFactor: number = 0.85,
    maxIterations: number = 35
  ): Map<string, number> {
    const N = entities.length;
    const pageRanks = new Map<string, number>();

    if (N === 0) return pageRanks;

    // Initialize with 1/N
    entities.forEach((e) => pageRanks.set(e.id, 1 / N));

    // Adjacency out-degree mapping
    const outEdges = new Map<string, string[]>();
    const inEdges = new Map<string, string[]>();

    entities.forEach((e) => {
      outEdges.set(e.id, []);
      inEdges.set(e.id, []);
    });

    relationships.forEach((rel) => {
      if (outEdges.has(rel.source) && inEdges.has(rel.target)) {
        outEdges.get(rel.source)!.push(rel.target);
        inEdges.get(rel.target)!.push(rel.source);
        // Treat connections bi-directionally for intelligence association rank
        outEdges.get(rel.target)!.push(rel.source);
        inEdges.get(rel.source)!.push(rel.target);
      }
    });

    for (let iter = 0; iter < maxIterations; iter++) {
      const nextRanks = new Map<string, number>();
      let danglingSum = 0;

      entities.forEach((e) => {
        const outList = outEdges.get(e.id) || [];
        if (outList.length === 0) {
          danglingSum += pageRanks.get(e.id)!;
        }
      });

      entities.forEach((e) => {
        const incoming = inEdges.get(e.id) || [];
        let incomingRankSum = 0;

        incoming.forEach((inNodeId) => {
          const outDegree = (outEdges.get(inNodeId) || []).length;
          if (outDegree > 0) {
            incomingRankSum += pageRanks.get(inNodeId)! / outDegree;
          }
        });

        const newRank =
          (1 - dampingFactor) / N +
          dampingFactor * (incomingRankSum + danglingSum / N);

        nextRanks.set(e.id, newRank);
      });

      // Update for next iteration
      nextRanks.forEach((rank, id) => {
        pageRanks.set(id, rank);
      });
    }

    return pageRanks;
  }

  /**
   * Calculate Degree Centrality and build combined metrics
   */
  public static calculateCentralityMetrics(
    entities: POLEEntity[],
    relationships: POLERelationship[]
  ): CentralityMetric[] {
    const N = entities.length;
    const connectionCounts = new Map<string, number>();

    entities.forEach((e) => connectionCounts.set(e.id, 0));

    relationships.forEach((rel) => {
      if (connectionCounts.has(rel.source)) {
        connectionCounts.set(rel.source, connectionCounts.get(rel.source)! + 1);
      }
      if (connectionCounts.has(rel.target)) {
        connectionCounts.set(rel.target, connectionCounts.get(rel.target)! + 1);
      }
    });

    const pageRanks = this.calculatePageRank(entities, relationships);

    return entities.map((entity) => {
      const degree = connectionCounts.get(entity.id) || 0;
      const degreeCentrality = N > 1 ? parseFloat((degree / (N - 1)).toFixed(4)) : 0;
      const rawPageRank = pageRanks.get(entity.id) || 0;
      const scaledPageRank = parseFloat((rawPageRank * N).toFixed(3)); // Scaled around 1.0 for intuitive reading

      return {
        entityId: entity.id,
        entityName: entity.name,
        type: entity.type,
        poleType: entity.poleType,
        connections: degree,
        degreeCentrality,
        pageRank: scaledPageRank,
        riskScore: entity.riskScore,
        riskLevel: entity.riskLevel,
      };
    });
  }

  /**
   * Formats Cytoscape graph nodes and edges with computed centrality
   */
  public static formatCytoscapeGraph(
    entities: POLEEntity[],
    relationships: POLERelationship[]
  ): GraphData {
    const centralityList = this.calculateCentralityMetrics(entities, relationships);
    const metricMap = new Map<string, CentralityMetric>();
    centralityList.forEach((c) => metricMap.set(c.entityId, c));

    const nodes = entities.map((entity) => {
      const metric = metricMap.get(entity.id);
      return {
        data: {
          id: entity.id,
          label: entity.name,
          poleType: entity.poleType,
          type: entity.type,
          riskScore: entity.riskScore,
          riskLevel: entity.riskLevel,
          degree: metric ? metric.connections : 0,
          pageRank: metric ? metric.pageRank : 0,
          properties: entity.properties,
        },
      };
    });

    const edges = relationships.map((rel) => {
      return {
        data: {
          id: rel.id,
          source: rel.source,
          target: rel.target,
          type: rel.type,
          label: rel.label || rel.type,
          timestamp: rel.timestamp,
          evidenceId: rel.evidenceId,
          details: rel.details,
          amount: rel.amount,
        },
      };
    });

    return { nodes, edges };
  }
}
