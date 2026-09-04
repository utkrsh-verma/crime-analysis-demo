import express, { Request, Response } from 'express';
import multer from 'multer';
import dotenv from 'dotenv';

import { CaseStore } from './services/caseStore.js';
import { CryptoVault } from './services/cryptoVault.js';
import { PoleParser } from './services/poleParser.js';
import { PdfParser } from './services/pdfParser.js';
import { GraphAnalytics } from './services/graphAnalytics.js';
import { RiskEngine } from './services/riskEngine.js';
import { ChatEngine } from './services/chatEngine.js';
import { SAMPLE_FILES } from './data/sampleFiles.js';
import { EvidenceRecord } from '../src/types.js';

dotenv.config();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
});

export const app = express();

app.use(express.json());

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 1. Dashboard statistics
app.get('/api/stats', (req: Request, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const stats = CaseStore.getDashboardStats(caseId);
    res.json(stats);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve stats', details: err.message });
  }
});

// 2. Cases Management
app.get('/api/cases', (req: Request, res: Response) => {
  try {
    const cases = CaseStore.getCases();
    res.json(cases);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve cases', details: err.message });
  }
});

app.get('/api/cases/:id', (req: Request, res: Response) => {
  try {
    const caseRecord = CaseStore.getCaseById(req.params.id);
    if (!caseRecord) {
      return res.status(404).json({ error: 'Case not found' });
    }
    res.json(caseRecord);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve case', details: err.message });
  }
});

app.post('/api/cases', (req: Request, res: Response) => {
  try {
    const { title, description, priority, leadInvestigator } = req.body;
    if (!title) {
      return res.status(400).json({ error: 'Case title is required' });
    }
    const newCase = CaseStore.createCase({
      title,
      description,
      priority: priority || 'MEDIUM',
      leadInvestigator: leadInvestigator || 'Special Agent (Cyber Division)',
      status: 'OPEN',
    });
    res.status(201).json(newCase);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to create case', details: err.message });
  }
});

// 3. Evidence Management & Upload
app.get('/api/evidence', (req: Request, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const list = CaseStore.getEvidenceList(caseId);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to list evidence', details: err.message });
  }
});

// Upload file (PDF, CSV, TXT, etc.)
app.post('/api/evidence/upload', upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = req.file;
    const caseId = (req.body.caseId as string) || 'CASE-001';

    // 1. Calculate SHA-256 Hash
    const sha256 = CryptoVault.calculateSha256(file.buffer);
    const evidenceId = `EV-${Date.now().toString().slice(-6)}`;

    // 2. Detect if PDF or Structured Text/CSV
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');

    let parseResult: any;
    let pageCount: number | undefined;
    let ocrApplied = false;
    let textSnippet: string | undefined;
    let pdfMetadata: any;

    if (isPdf) {
      const pdfDetails = await PdfParser.parsePdfBuffer(
        file.buffer,
        file.originalname,
        evidenceId,
        caseId,
        CaseStore.getEntities(caseId)
      );
      parseResult = pdfDetails;
      pageCount = pdfDetails.pageCount;
      ocrApplied = pdfDetails.ocrApplied;
      textSnippet = pdfDetails.textSnippet;
      pdfMetadata = pdfDetails.metadata;
    } else {
      const fileContent = file.buffer.toString('utf-8');
      parseResult = PoleParser.parseFile(
        fileContent,
        file.originalname,
        evidenceId,
        caseId,
        CaseStore.getEntities(caseId)
      );
    }

    // 3. Create Evidence Record
    const record: EvidenceRecord = {
      id: evidenceId,
      caseId,
      fileName: file.originalname,
      fileType: (isPdf ? 'PDF_REPORT' : parseResult.fileType) as any,
      fileSize: file.size,
      uploadDate: new Date().toISOString(),
      sha256,
      originalHash: sha256,
      status: 'PROCESSED',
      verificationStatus: 'VERIFIED',
      lastVerifiedDate: new Date().toISOString(),
      entitiesExtracted: parseResult.entities.length,
      relationshipsExtracted: parseResult.relationships.length,
      extractedEntityIds: parseResult.entities.map((e: any) => e.id),
      notes: isPdf
        ? `Parsed PDF document via pdf-parse & OCR engine. Extracted ${parseResult.entities.length} entities and ${parseResult.relationships.length} relationships.${ocrApplied ? ' (OCR Applied)' : ''}`
        : `Uploaded via Investigation Intake. Extracted ${parseResult.entities.length} entities and ${parseResult.relationships.length} relationships.`,
      pageCount,
      ocrApplied,
      extractedTextSnippet: textSnippet,
      pdfMetadata,
    };

    // 4. Save to CaseStore
    CaseStore.storeEvidenceFile(record, file.buffer);
    CaseStore.addExtractedData(
      evidenceId,
      caseId,
      parseResult.entities,
      parseResult.relationships,
      parseResult.events
    );

    res.status(201).json({
      success: true,
      evidence: record,
      extracted: {
        entitiesCount: parseResult.entities.length,
        relationshipsCount: parseResult.relationships.length,
        eventsCount: parseResult.events.length,
        isPdf,
        ocrApplied,
      },
    });
  } catch (err: any) {
    console.error('Evidence upload error:', err);
    res.status(500).json({ error: 'Evidence processing failed', details: err.message });
  }
});

// Verify SHA-256 Hash Integrity
app.post('/api/evidence/verify', (req: Request, res: Response) => {
  try {
    const { evidenceId } = req.body;
    if (!evidenceId) {
      return res.status(400).json({ error: 'evidenceId is required' });
    }

    const evidence = CaseStore.getEvidenceById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence record not found' });
    }

    const fileBuf = CaseStore.getEvidenceFileBuffer(evidenceId);
    if (!fileBuf) {
      return res.status(404).json({ error: 'Underlying evidence file data not found in vault' });
    }

    const result = CryptoVault.verifyFileIntegrity(fileBuf, evidence.originalHash);

    // Update evidence record status
    evidence.verificationStatus = result.status;
    evidence.lastVerifiedDate = result.verifiedAt;
    evidence.sha256 = result.currentHash;
    if (!result.verified) {
      evidence.status = 'TAMPERED';
    }

    res.json({
      evidenceId,
      fileName: evidence.fileName,
      ...result,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Verification failed', details: err.message });
  }
});

// Sample files metadata & download/load
app.get('/api/evidence/samples', (req: Request, res: Response) => {
  res.json(Object.values(SAMPLE_FILES).map((s) => ({
    id: s.id,
    name: s.name,
    type: s.type,
    description: s.description,
  })));
});

app.post('/api/evidence/load-sample', async (req: Request, res: Response) => {
  try {
    const { sampleId, caseId = 'CASE-001' } = req.body;
    const sample = SAMPLE_FILES[sampleId];
    if (!sample) {
      return res.status(404).json({ error: 'Sample dataset not found' });
    }

    const isPdf = sample.type === 'PDF_REPORT' || sample.name.toLowerCase().endsWith('.pdf');
    const buf = Buffer.from(sample.content, isPdf ? 'binary' : 'utf-8');
    const sha256 = CryptoVault.calculateSha256(buf);
    const evidenceId = `EV-${Date.now().toString().slice(-6)}`;

    let parseResult: any;
    let pageCount: number | undefined;
    let ocrApplied = false;
    let textSnippet: string | undefined;
    let pdfMetadata: any;

    if (isPdf) {
      const pdfDetails = await PdfParser.parsePdfBuffer(
        buf,
        sample.name,
        evidenceId,
        caseId,
        CaseStore.getEntities(caseId)
      );
      parseResult = pdfDetails;
      pageCount = pdfDetails.pageCount;
      ocrApplied = pdfDetails.ocrApplied;
      textSnippet = pdfDetails.textSnippet;
      pdfMetadata = pdfDetails.metadata;
    } else {
      parseResult = PoleParser.parseFile(
        sample.content,
        sample.name,
        evidenceId,
        caseId,
        CaseStore.getEntities(caseId)
      );
    }

    const record: EvidenceRecord = {
      id: evidenceId,
      caseId,
      fileName: sample.name,
      fileType: sample.type,
      fileSize: buf.length,
      uploadDate: new Date().toISOString(),
      sha256,
      originalHash: sha256,
      status: 'PROCESSED',
      verificationStatus: 'VERIFIED',
      lastVerifiedDate: new Date().toISOString(),
      entitiesExtracted: parseResult.entities.length,
      relationshipsExtracted: parseResult.relationships.length,
      extractedEntityIds: parseResult.entities.map((e: any) => e.id),
      notes: isPdf
        ? `Loaded sample PDF dossier: ${sample.description}. Extracted ${parseResult.entities.length} entities and ${parseResult.relationships.length} relationships.`
        : `Loaded sample dataset: ${sample.description}`,
      pageCount,
      ocrApplied,
      extractedTextSnippet: textSnippet,
      pdfMetadata,
    };

    CaseStore.storeEvidenceFile(record, buf);
    CaseStore.addExtractedData(
      evidenceId,
      caseId,
      parseResult.entities,
      parseResult.relationships,
      parseResult.events
    );

    res.status(201).json({
      success: true,
      evidence: record,
      extracted: {
        entitiesCount: parseResult.entities.length,
        relationshipsCount: parseResult.relationships.length,
        eventsCount: parseResult.events.length,
        isPdf,
        ocrApplied,
      },
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to load sample', details: err.message });
  }
});

// Dedicated PDF OCR inspection endpoint
app.post('/api/evidence/ocr-inspect', async (req: Request, res: Response) => {
  try {
    const { evidenceId } = req.body;
    if (!evidenceId) {
      return res.status(400).json({ error: 'evidenceId is required' });
    }

    const evidence = CaseStore.getEvidenceById(evidenceId);
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence record not found' });
    }

    const fileBuf = CaseStore.getEvidenceFileBuffer(evidenceId);
    if (!fileBuf) {
      return res.status(404).json({ error: 'Evidence file data not found in vault' });
    }

    const pdfDetails = await PdfParser.parsePdfBuffer(
      fileBuf,
      evidence.fileName,
      evidence.id,
      evidence.caseId,
      CaseStore.getEntities(evidence.caseId),
      true // force OCR
    );

    res.json({
      evidenceId: evidence.id,
      fileName: evidence.fileName,
      pageCount: pdfDetails.pageCount,
      ocrApplied: pdfDetails.ocrApplied,
      rawText: pdfDetails.rawText,
      metadata: pdfDetails.metadata,
      extractedEntitiesCount: pdfDetails.entities.length,
      extractedRelationshipsCount: pdfDetails.relationships.length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'OCR inspection failed', details: err.message });
  }
});

// Tamper test simulation
app.post('/api/evidence/tamper-test', (req: Request, res: Response) => {
  try {
    const { evidenceId } = req.body;
    if (!evidenceId) return res.status(400).json({ error: 'evidenceId required' });
    const success = CaseStore.tamperEvidenceFile(evidenceId);
    if (!success) return res.status(404).json({ error: 'Evidence not found' });
    res.json({ success: true, message: `Evidence ${evidenceId} payload deliberately modified in storage. Run verification to detect hash mismatch.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Tamper simulation failed', details: err.message });
  }
});

// Restore clean evidence file
app.post('/api/evidence/restore', (req: Request, res: Response) => {
  try {
    const { evidenceId } = req.body;
    if (!evidenceId) return res.status(400).json({ error: 'evidenceId required' });
    const success = CaseStore.restoreEvidenceFile(evidenceId);
    if (!success) return res.status(404).json({ error: 'Evidence not found' });
    res.json({ success: true, message: `Evidence ${evidenceId} restored to original verified state.` });
  } catch (err: any) {
    res.status(500).json({ error: 'Restore failed', details: err.message });
  }
});

// 4. Graph Data (Cytoscape formatted)
app.get('/api/graph', (req: Request, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const entities = CaseStore.getEntities(caseId);
    const relationships = CaseStore.getRelationships(caseId);

    const graph = GraphAnalytics.formatCytoscapeGraph(entities, relationships);
    res.json(graph);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate graph', details: err.message });
  }
});

// 5. Entities List & Details
app.get('/api/entities', (req: Request, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const poleType = req.query.poleType as string | undefined;
    const type = req.query.type as string | undefined;
    const riskLevel = req.query.riskLevel as string | undefined;
    const search = (req.query.search as string | undefined)?.toLowerCase();

    let entities = CaseStore.getEntities(caseId);

    if (poleType && poleType !== 'ALL') {
      entities = entities.filter((e) => e.poleType === poleType);
    }
    if (type && type !== 'ALL') {
      entities = entities.filter((e) => e.type === type);
    }
    if (riskLevel && riskLevel !== 'ALL') {
      entities = entities.filter((e) => e.riskLevel === riskLevel);
    }
    if (search) {
      entities = entities.filter(
        (e) =>
          e.name.toLowerCase().includes(search) ||
          e.id.toLowerCase().includes(search) ||
          JSON.stringify(e.properties).toLowerCase().includes(search)
      );
    }

    res.json(entities);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve entities', details: err.message });
  }
});

app.get('/api/entities/:id', (req: Request, res: Response) => {
  try {
    const entity = CaseStore.getEntityById(req.params.id);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const allEntities = CaseStore.getEntities(entity.caseId);
    const relationships = CaseStore.getRelationships(entity.caseId);
    const events = CaseStore.getEvents(entity.caseId);

    const risk = RiskEngine.evaluateEntityRisk(entity, allEntities, relationships, events);

    const directRels = relationships.filter(
      (r) => r.source === entity.id || r.target === entity.id
    );

    const directEvents = events.filter(
      (ev) =>
        ev.sourceEntityId === entity.id ||
        ev.targetEntityId === entity.id ||
        ev.locationId === entity.id
    );

    res.json({
      entity,
      risk,
      relationships: directRels,
      events: directEvents,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve entity details', details: err.message });
  }
});

// 6. Centrality Analysis
app.get('/api/graph/centrality', (req: Request, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const entities = CaseStore.getEntities(caseId);
    const relationships = CaseStore.getRelationships(caseId);

    const metrics = GraphAnalytics.calculateCentralityMetrics(entities, relationships);
    res.json(metrics);
  } catch (err: any) {
    res.status(500).json({ error: 'Centrality calculation failed', details: err.message });
  }
});

// 7. BFS Shortest Path
app.get('/api/graph/shortest-path', (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const target = req.query.target as string;
    const caseId = req.query.caseId as string | undefined;

    if (!source || !target) {
      return res.status(400).json({ error: 'Both source and target entity IDs are required' });
    }

    const entities = CaseStore.getEntities(caseId);
    const relationships = CaseStore.getRelationships(caseId);

    const result = GraphAnalytics.findShortestPath(source, target, entities, relationships);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Shortest path computation failed', details: err.message });
  }
});

// 7b. Multi-Hop Path Analysis (All paths up to N hops)
app.get('/api/graph/multi-hop-paths', (req: Request, res: Response) => {
  try {
    const source = req.query.source as string;
    const target = req.query.target as string;
    const caseId = req.query.caseId as string | undefined;
    const maxHops = Math.min(Math.max(parseInt((req.query.maxHops as string) || '4', 10), 1), 6);
    const maxPaths = Math.min(Math.max(parseInt((req.query.maxPaths as string) || '15', 10), 1), 50);

    if (!source || !target) {
      return res.status(400).json({ error: 'Both source and target entity IDs are required' });
    }

    const entities = CaseStore.getEntities(caseId);
    const relationships = CaseStore.getRelationships(caseId);

    const result = GraphAnalytics.findMultiHopPaths(source, target, entities, relationships, maxHops, maxPaths);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Multi-hop path analysis failed', details: err.message });
  }
});

// 7c. N-Hop Neighborhood / Ego Network Discovery
app.get('/api/graph/neighborhood', (req: Request, res: Response) => {
  try {
    const entityId = req.query.entityId as string;
    const caseId = req.query.caseId as string | undefined;
    const maxHops = Math.min(Math.max(parseInt((req.query.maxHops as string) || '2', 10), 1), 4);

    if (!entityId) {
      return res.status(400).json({ error: 'entityId is required' });
    }

    const entities = CaseStore.getEntities(caseId);
    const relationships = CaseStore.getRelationships(caseId);

    const result = GraphAnalytics.getNHopNeighborhood(entityId, entities, relationships, maxHops);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Neighborhood discovery failed', details: err.message });
  }
});

// 8. Investigation Timeline
app.get('/api/timeline', (req: Request, res: Response) => {
  try {
    const caseId = req.query.caseId as string | undefined;
    const entityId = req.query.entityId as string | undefined;
    const type = req.query.type as string | undefined;

    let events = CaseStore.getEvents(caseId);

    if (entityId && entityId !== 'ALL') {
      events = events.filter(
        (e) => e.sourceEntityId === entityId || e.targetEntityId === entityId || e.locationId === entityId
      );
    }

    if (type && type !== 'ALL') {
      events = events.filter((e) => e.type === type);
    }

    res.json(events);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to retrieve timeline', details: err.message });
  }
});

// 9. Explainable AI (XAI) Risk Assessment
app.get('/api/risk/:entityId', (req: Request, res: Response) => {
  try {
    const entity = CaseStore.getEntityById(req.params.entityId);
    if (!entity) {
      return res.status(404).json({ error: 'Entity not found' });
    }

    const allEntities = CaseStore.getEntities(entity.caseId);
    const relationships = CaseStore.getRelationships(entity.caseId);
    const events = CaseStore.getEvents(entity.caseId);

    const assessment = RiskEngine.evaluateEntityRisk(entity, allEntities, relationships, events);
    res.json(assessment);
  } catch (err: any) {
    res.status(500).json({ error: 'Risk evaluation failed', details: err.message });
  }
});

// 10. Investigation Chat
app.post('/api/chat/query', async (req: Request, res: Response) => {
  try {
    const { query, caseId } = req.body;
    if (!query || typeof query !== 'string') {
      return res.status(400).json({ error: 'Query string is required' });
    }

    const response = await ChatEngine.answerQuery(query, caseId);
    res.json(response);
  } catch (err: any) {
    console.error('Chat query error:', err);
    res.status(500).json({ error: 'Chat processing error', details: err.message });
  }
});

// 11. Reset / Seed Demo Intelligence Data
app.post('/api/admin/reset-demo', (req: Request, res: Response) => {
  try {
    CaseStore.resetDemoData();
    res.json({
      success: true,
      message: 'Demo intelligence data restored to pristine state across all cases.',
      casesCount: CaseStore.getCases().length,
      entitiesCount: CaseStore.getEntities().length,
      evidenceCount: CaseStore.getEvidenceList().length,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to reset demo data', details: err.message });
  }
});

export default app;
