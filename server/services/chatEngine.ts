import { GoogleGenAI } from '@google/genai';
import { CaseStore } from './caseStore.js';
import { GraphAnalytics } from './graphAnalytics.js';
import { ChatMessage } from '../types.js';

export class ChatEngine {
  private static geminiClient: GoogleGenAI | null = null;

  private static getGeminiClient(): GoogleGenAI | null {
    if (!this.geminiClient && process.env.GEMINI_API_KEY) {
      this.geminiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.geminiClient;
  }

  /**
   * Processes investigation questions using a controlled rule parser + Gemini AI fallback
   */
  public static async answerQuery(query: string, caseId?: string): Promise<ChatMessage> {
    const q = query.trim().toLowerCase().replace(/-/g, ' ');
    const entities = CaseStore.getEntities(caseId);
    const relationships = CaseStore.getRelationships(caseId);
    const events = CaseStore.getEvents(caseId);

    // 1. Query: High risk persons / entities
    if (q.includes('high risk') || q.includes('critical risk') || q.includes('dangerous') || q.includes('suspects')) {
      const highRisk = entities.filter(
        (e) => (e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL') && (q.includes('person') ? e.poleType === 'PERSON' : true)
      ).sort((a, b) => b.riskScore - a.riskScore);

      const listStr = highRisk
        .slice(0, 8)
        .map((e) => `• [${e.id}] ${e.name} (${e.type}) — Risk Score: ${e.riskScore}/100 [${e.riskLevel}]`)
        .join('\n');

      return {
        id: `MSG_${Date.now()}`,
        sender: 'assistant',
        text: `Identified ${highRisk.length} high & critical risk ${q.includes('person') ? 'persons' : 'entities'} in this investigation:\n\n${listStr}\n\nAll highlighted on the investigation graph canvas.`,
        timestamp: new Date().toISOString(),
        source: 'RULE_PARSER',
        highlightNodeIds: highRisk.map((e) => e.id),
        dataSnapshot: highRisk,
      };
    }

    // 2. Query: Shortest path between X and Y
    const pathMatch =
      q.match(/path\s+(?:between\s+)?([a-zA-Z0-9_\-+]+)\s+(?:and|to)\s+([a-zA-Z0-9_\-+]+)/i) ||
      q.match(/connect(?:ion)?\s+(?:between\s+)?([a-zA-Z0-9_\-+]+)\s+(?:and|to)\s+([a-zA-Z0-9_\-+]+)/i);

    if (pathMatch) {
      const term1 = pathMatch[1].trim();
      const term2 = pathMatch[2].trim();

      const e1 = entities.find(
        (e) => e.id.toLowerCase() === term1.toLowerCase() || e.name.toLowerCase().includes(term1.toLowerCase())
      );
      const e2 = entities.find(
        (e) => e.id.toLowerCase() === term2.toLowerCase() || e.name.toLowerCase().includes(term2.toLowerCase())
      );

      if (e1 && e2) {
        const pathResult = GraphAnalytics.findShortestPath(e1.id, e2.id, entities, relationships);
        if (pathResult.found) {
          const chain = pathResult.path.map((p) => `${p.entityName} [${p.entityId}]`).join(' ➔ ');
          return {
            id: `MSG_${Date.now()}`,
            sender: 'assistant',
            text: `Shortest connection path discovered (${pathResult.hops} hops):\n\n${chain}\n\nRelationship chain:\n${pathResult.relationships.map((r, i) => `${i + 1}. [${r.from}] ➔ ${r.type} ➔ [${r.to}]`).join('\n')}`,
            timestamp: new Date().toISOString(),
            source: 'RULE_PARSER',
            highlightNodeIds: pathResult.nodeIds,
            dataSnapshot: pathResult,
          };
        } else {
          return {
            id: `MSG_${Date.now()}`,
            sender: 'assistant',
            text: `No direct or indirect graph connection found between ${e1.name} [${e1.id}] and ${e2.name} [${e2.id}] within the currently parsed evidence.`,
            timestamp: new Date().toISOString(),
            source: 'RULE_PARSER',
          };
        }
      }
    }

    // 3. Query: Connections of entity ID or Person Name
    const connMatch =
      q.match(/connections?\s+(?:of|for)\s+([a-zA-Z0-9_\-+\s]+)/i) ||
      q.match(/who\s+is\s+connected\s+to\s+([a-zA-Z0-9_\-+\s]+)/i) ||
      q.match(/associates?\s+(?:of|for)\s+([a-zA-Z0-9_\-+\s]+)/i);

    if (connMatch) {
      const targetTerm = connMatch[1].trim();
      const targetEntity = entities.find(
        (e) => e.id.toLowerCase() === targetTerm.toLowerCase() || e.name.toLowerCase().includes(targetTerm.toLowerCase())
      );

      if (targetEntity) {
        const directRels = relationships.filter(
          (r) => r.source === targetEntity.id || r.target === targetEntity.id
        );
        const neighborIds = directRels.map((r) => (r.source === targetEntity.id ? r.target : r.source));
        const neighborEntities = entities.filter((e) => neighborIds.includes(e.id));

        const relLines = directRels.map((r) => {
          const otherId = r.source === targetEntity.id ? r.target : r.source;
          const other = entities.find((e) => e.id === otherId);
          return `• ${r.type}: ${other ? other.name : otherId} [${other ? other.type : 'ENTITY'}] ${r.label ? `(${r.label})` : ''}`;
        });

        return {
          id: `MSG_${Date.now()}`,
          sender: 'assistant',
          text: `Found ${directRels.length} direct criminal network connections for ${targetEntity.name} [${targetEntity.id}]:\n\n${relLines.join('\n')}`,
          timestamp: new Date().toISOString(),
          source: 'RULE_PARSER',
          highlightNodeIds: [targetEntity.id, ...neighborIds],
          dataSnapshot: neighborEntities,
        };
      }
    }

    // 4. Query: Transactions above amount (e.g. 1 lakh, 100000, 500000)
    if (q.includes('transaction') || q.includes('transfer') || q.includes('lakh') || q.includes('money')) {
      let threshold = 100000; // default 1 Lakh
      if (q.includes('10 lakh') || q.includes('1000000') || q.includes('10,00,000')) threshold = 1000000;
      else if (q.includes('50 lakh') || q.includes('5000000')) threshold = 5000000;
      else if (q.includes('5 lakh') || q.includes('500000')) threshold = 500000;

      const txRels = relationships.filter((r) => r.type === 'TRANSFERRED' && (r.amount || 0) >= threshold);
      const txNodes = new Set<string>();
      txRels.forEach((r) => {
        txNodes.add(r.source);
        txNodes.add(r.target);
      });

      const lines = txRels.map((r) => {
        const src = entities.find((e) => e.id === r.source)?.name || r.source;
        const tgt = entities.find((e) => e.id === r.target)?.name || r.target;
        return `• ₹${(r.amount || 0).toLocaleString('en-IN')}: ${src} ➔ ${tgt} [${r.timestamp || 'Recorded'}]`;
      });

      return {
        id: `MSG_${Date.now()}`,
        sender: 'assistant',
        text: `Found ${txRels.length} transactions exceeding ₹${threshold.toLocaleString('en-IN')}:\n\n${lines.join('\n')}\n\nBoth sender and beneficiary accounts highlighted on graph.`,
        timestamp: new Date().toISOString(),
        source: 'RULE_PARSER',
        highlightNodeIds: Array.from(txNodes),
        dataSnapshot: txRels,
      };
    }

    // 5. Query: Events involving person or entity
    const eventMatch = q.match(/events?\s+(?:involving|for|about)\s+([a-zA-Z0-9_\-+\s]+)/i);
    if (eventMatch) {
      const term = eventMatch[1].trim();
      const target = entities.find(
        (e) => e.id.toLowerCase() === term.toLowerCase() || e.name.toLowerCase().includes(term.toLowerCase())
      );

      if (target) {
        const matchedEvents = events.filter(
          (e) => e.sourceEntityId === target.id || e.targetEntityId === target.id || e.locationId === target.id
        );

        const lines = matchedEvents.map(
          (e) => `• [${new Date(e.timestamp).toLocaleTimeString()}] ${e.title}: ${e.description}`
        );

        return {
          id: `MSG_${Date.now()}`,
          sender: 'assistant',
          text: `Retrieved ${matchedEvents.length} chronological events involving ${target.name} [${target.id}]:\n\n${lines.join('\n')}`,
          timestamp: new Date().toISOString(),
          source: 'RULE_PARSER',
          highlightNodeIds: [target.id],
          dataSnapshot: matchedEvents,
        };
      }
    }

    // 6. Query: Tower 45 or Location connections
    if (q.includes('tower 45') || q.includes('warehouse 12') || q.includes('regal plaza') || q.includes('vasant kunj')) {
      const loc = entities.find((e) => e.poleType === 'LOCATION' && q.includes(e.name.toLowerCase().slice(0, 8)));
      if (loc) {
        const connectedRels = relationships.filter((r) => r.source === loc.id || r.target === loc.id);
        const connectedNodeIds = connectedRels.map((r) => (r.source === loc.id ? r.target : r.source));
        const connectedEntities = entities.filter((e) => connectedNodeIds.includes(e.id));

        const lines = connectedEntities.map((e) => `• [${e.type}] ${e.name} (${e.id}) - Risk: ${e.riskScore}/100`);

        return {
          id: `MSG_${Date.now()}`,
          sender: 'assistant',
          text: `Entities located at or connected to ${loc.name} [${loc.id}]:\n\n${lines.join('\n')}\n\nHighlighted on graph canvas.`,
          timestamp: new Date().toISOString(),
          source: 'RULE_PARSER',
          highlightNodeIds: [loc.id, ...connectedNodeIds],
          dataSnapshot: connectedEntities,
        };
      }
    }

    // 7. Optional Gemini server-side AI fallback if GEMINI_API_KEY is available
    const gemini = this.getGeminiClient();
    if (gemini) {
      try {
        const topEntities = entities.slice(0, 15).map((e) => `${e.name} (${e.id}, ${e.type}, Risk: ${e.riskScore})`).join(', ');
        const prompt = `You are CrimeNet Analyst AI, an expert criminal intelligence assistant. Answer the investigator's query based ONLY on the following synthetic demo investigation data:
Entities: ${topEntities}
Query: "${query}"
Respond concisely, professionally, and factually in 2-4 sentences using law-enforcement intelligence terminology. Do not invent non-existent suspects.`;

        const response = await gemini.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

        const reply = response.text || 'No response generated.';
        return {
          id: `MSG_${Date.now()}`,
          sender: 'assistant',
          text: reply,
          timestamp: new Date().toISOString(),
          source: 'GEMINI_AI',
        };
      } catch (err) {
        console.error('Gemini AI chat error, falling back to rule response:', err);
      }
    }

    // Default Fallback
    return {
      id: `MSG_${Date.now()}`,
      sender: 'assistant',
      text: `Investigation Assistant Command Parser:\n\nYou can query this dataset using commands such as:\n• "Show high-risk persons."\n• "Find connections of P001" or "connections of Utkarsh Verma"\n• "Find the shortest path between P001 and P005"\n• "Show transactions above 1 lakh"\n• "Show events involving Utkarsh Verma"\n• "Show all entities connected to Tower 45"`,
      timestamp: new Date().toISOString(),
      source: 'RULE_PARSER',
    };
  }
}
