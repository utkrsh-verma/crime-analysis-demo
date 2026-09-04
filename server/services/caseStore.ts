import {
  CaseRecord,
  EvidenceRecord,
  POLEEntity,
  POLERelationship,
  InvestigationEvent,
  DashboardStats,
} from '../types.js';
import {
  INITIAL_CASES,
  INITIAL_ENTITIES,
  INITIAL_RELATIONSHIPS,
  INITIAL_EVENTS,
  INITIAL_EVIDENCE,
} from '../data/initialData.js';
import { SAMPLE_FILES } from '../data/sampleFiles.js';
import { CryptoVault } from './cryptoVault.js';

export class CaseStore {
  private static cases: CaseRecord[] = [...INITIAL_CASES];
  private static entities: POLEEntity[] = [...INITIAL_ENTITIES];
  private static relationships: POLERelationship[] = [...INITIAL_RELATIONSHIPS];
  private static events: InvestigationEvent[] = [...INITIAL_EVENTS];
  private static evidence: EvidenceRecord[] = [...INITIAL_EVIDENCE];

  // In-memory buffer store for original file contents
  private static fileBuffers: Map<string, Buffer> = new Map();

  // Initialize sample file buffers and compute their initial SHA-256
  public static initialize(): void {
    if (this.fileBuffers.size > 0) return;

    // Populate initial evidence buffers from sample files
    const sampleMapping: Record<string, string> = {
      'EV-001': SAMPLE_FILES.cdr.content,
      'EV-002': SAMPLE_FILES.bank.content,
      'EV-003': SAMPLE_FILES.vehicle.content,
      'EV-004': SAMPLE_FILES.fir.content,
      'EV-005': SAMPLE_FILES.pdf_dossier.content,
      'EV-006': `timestamp,source,target,duration,satellite_channel\n2026-08-28T18:45:00Z,+919821098765,Capt_Dilip_Joshi,180,Inmarsat_Ch_12\n2026-08-28T19:10:00Z,+919821098765,+919833456789,95,Inmarsat_Ch_14\n2026-08-28T21:00:00Z,+919821098765,Sameer_Al_Balushi,240,Inmarsat_Ch_12`,
      'EV-007': `timestamp,toll_id,camera,vehicle_plate,confidence,speed_kmh\n2026-08-29T09:30:12Z,Charoti_Toll_NH48,Lane_03_ANPR,MH-04-AZ-9901,98.4,62\n2026-08-29T09:30:20Z,Charoti_Toll_NH48,Lane_03_ANPR,MH-04-BC-2234,99.1,64\n2026-08-29T14:40:00Z,Surat_RingRoad_Junction,Lane_01_ANPR,MH-04-AZ-9901,97.8,45`,
      'EV-008': `FIRST INFORMATION REPORT / CUSTOMS INTERDICTION REPORT\nRef: DRI/MUM/2026/118\nAccused: Tariq Merchant, Capt. Dilip Joshi, Farhan Qureshi\nSeizure: Contraband goods worth 18.4 Cr recovered at Berth 4 Nhava Sheva Terminal and Surat Transshipment Hub. Canara Bank Escrow 908123 frozen under Section 102 CrPC.`,
      'EV-009': `company_cin,company_name,director_name,turnover_declared,actual_inflow,status\nU70109DL2024PTC992102,Golden Crest Luxury Towers SPV,Pradeep Narang,100000,485000000,FLAGGED_STR\nU74999DL2023PTC881023,Orion Shell Holding India,Anita Sen,50000,120000000,BOGUS_VALUATION\nU65999MH2024PTC771092,Worli Horizon Capital,Harish Singhania,500000,620000000,ED_ATTACHMENT`,
      'EV-010': `swift_reference,ordering_customer,beneficiary_customer,amount_inr,value_date,nostro_bank\nSWIFT-MT103-90218,Golden Crest SPV (SCBL BKC),Emirates NBD Trust Dubai,185000000,2026-08-18,SCBL-DIFC-UAE\nSWIFT-MT103-90219,Anita Sen Consultancy,Orion Digital Cayman,35000000,2026-08-25,M247-FRANKFURT-OTC\nSWIFT-MT103-90220,Kabir Chawla OTC,Binance Custody Escrow,120000000,2026-08-30,USDT-TRC20-SETTLEMENT`,
    };

    this.evidence.forEach((ev) => {
      const isPdf = ev.fileName.toLowerCase().endsWith('.pdf') || ev.fileType === 'PDF_REPORT';
      const content = sampleMapping[ev.id] || `Sample evidence content for ${ev.fileName}`;
      const buf = Buffer.from(content, isPdf ? 'binary' : 'utf-8');
      this.fileBuffers.set(ev.id, buf);
      const hash = CryptoVault.calculateSha256(buf);
      ev.sha256 = hash;
      ev.originalHash = hash;
      ev.fileSize = buf.length;
    });
  }

  public static resetDemoData(): void {
    this.cases = [...INITIAL_CASES];
    this.entities = [...INITIAL_ENTITIES];
    this.relationships = [...INITIAL_RELATIONSHIPS];
    this.events = [...INITIAL_EVENTS];
    this.evidence = [...INITIAL_EVIDENCE];
    this.fileBuffers.clear();
    this.initialize();
  }

  public static getCases(): CaseRecord[] {
    return this.cases.map((c) => {
      const caseEvidence = this.evidence.filter((e) => e.caseId === c.id);
      const caseEntities = this.entities.filter((e) => e.caseId === c.id);
      return {
        ...c,
        evidenceCount: caseEvidence.length,
        entityCount: caseEntities.length,
      };
    });
  }

  public static getCaseById(id: string): CaseRecord | undefined {
    return this.getCases().find((c) => c.id === id);
  }

  public static createCase(payload: Partial<CaseRecord>): CaseRecord {
    const newId = `CASE-00${this.cases.length + 1}`;
    const newCase: CaseRecord = {
      id: newId,
      title: payload.title || `Investigation Case ${newId}`,
      description: payload.description || 'Case dossier opened for intelligence analysis.',
      status: payload.status || 'OPEN',
      priority: payload.priority || 'MEDIUM',
      leadInvestigator: payload.leadInvestigator || 'Special Agent (Directorate of Criminal Intelligence)',
      createdDate: new Date().toISOString(),
      updatedDate: new Date().toISOString(),
      evidenceCount: 0,
      entityCount: 0,
    };
    this.cases.unshift(newCase);
    return newCase;
  }

  public static getEntities(caseId?: string): POLEEntity[] {
    if (!caseId || caseId === 'ALL') {
      return this.entities;
    }
    return this.entities.filter((e) => e.caseId === caseId);
  }

  public static getEntityById(id: string): POLEEntity | undefined {
    return this.entities.find((e) => e.id === id);
  }

  public static getRelationships(caseId?: string): POLERelationship[] {
    if (!caseId || caseId === 'ALL') {
      return this.relationships;
    }
    const caseEntities = new Set(this.getEntities(caseId).map((e) => e.id));
    return this.relationships.filter(
      (r) => caseEntities.has(r.source) || caseEntities.has(r.target)
    );
  }

  public static getEvents(caseId?: string): InvestigationEvent[] {
    const list = (!caseId || caseId === 'ALL')
      ? this.events
      : this.events.filter((e) => e.caseId === caseId);

    // Sort chronologically ascending
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  public static getEvidenceList(caseId?: string): EvidenceRecord[] {
    if (!caseId || caseId === 'ALL') {
      return this.evidence;
    }
    return this.evidence.filter((e) => e.caseId === caseId);
  }

  public static getEvidenceById(id: string): EvidenceRecord | undefined {
    return this.evidence.find((e) => e.id === id);
  }

  public static storeEvidenceFile(record: EvidenceRecord, buffer: Buffer): void {
    this.evidence.unshift(record);
    this.fileBuffers.set(record.id, buffer);

    // Update case count
    const c = this.cases.find((cs) => cs.id === record.caseId);
    if (c) {
      c.evidenceCount += 1;
      c.updatedDate = new Date().toISOString();
    }
  }

  public static getEvidenceFileBuffer(evidenceId: string): Buffer | undefined {
    return this.fileBuffers.get(evidenceId);
  }

  /**
   * Intentionally tamper with the file buffer to demonstrate evidence integrity verification
   */
  public static tamperEvidenceFile(evidenceId: string): boolean {
    const buf = this.fileBuffers.get(evidenceId);
    const ev = this.evidence.find((e) => e.id === evidenceId);
    if (!buf || !ev) return false;

    // Mutate the buffer content
    const tamperedContent = buf.toString('utf-8') + '\n[UNAUTHORIZED_MODIFICATION_CORRUPTED_ENTRY_ALERT]';
    this.fileBuffers.set(evidenceId, Buffer.from(tamperedContent, 'utf-8'));
    ev.verificationStatus = 'TAMPERED';
    ev.status = 'TAMPERED';
    ev.lastVerifiedDate = new Date().toISOString();
    return true;
  }

  /**
   * Restore original clean buffer
   */
  public static restoreEvidenceFile(evidenceId: string): boolean {
    const ev = this.evidence.find((e) => e.id === evidenceId);
    if (!ev) return false;

    // Restore from sample files or reset
    const sampleMapping: Record<string, string> = {
      'EV-001': SAMPLE_FILES.cdr.content,
      'EV-002': SAMPLE_FILES.bank.content,
      'EV-003': SAMPLE_FILES.vehicle.content,
      'EV-004': SAMPLE_FILES.fir.content,
    };
    const cleanContent = sampleMapping[ev.id] || `Restored clean evidence for ${ev.fileName}`;
    const cleanBuf = Buffer.from(cleanContent, 'utf-8');
    this.fileBuffers.set(evidenceId, cleanBuf);
    ev.sha256 = CryptoVault.calculateSha256(cleanBuf);
    ev.originalHash = ev.sha256;
    ev.verificationStatus = 'VERIFIED';
    ev.status = 'PROCESSED';
    ev.lastVerifiedDate = new Date().toISOString();
    return true;
  }

  public static addExtractedData(
    evidenceId: string,
    caseId: string,
    newEntities: POLEEntity[],
    newRelationships: POLERelationship[],
    newEvents: InvestigationEvent[]
  ): void {
    // Merge entities by ID or exact match to prevent duplicates
    newEntities.forEach((newEnt) => {
      const existing = this.entities.find(
        (e) => e.id === newEnt.id || (e.name.toLowerCase() === newEnt.name.toLowerCase() && e.poleType === newEnt.poleType)
      );
      if (existing) {
        if (!existing.evidenceIds.includes(evidenceId)) {
          existing.evidenceIds.push(evidenceId);
        }
      } else {
        this.entities.push(newEnt);
      }
    });

    // Merge relationships
    newRelationships.forEach((rel) => {
      const exists = this.relationships.some(
        (r) => r.source === rel.source && r.target === rel.target && r.type === rel.type
      );
      if (!exists) {
        this.relationships.push(rel);
      }
    });

    // Merge events
    newEvents.forEach((ev) => {
      this.events.push(ev);
    });

    // Update case metadata
    const c = this.cases.find((cs) => cs.id === caseId);
    if (c) {
      c.entityCount = this.getEntities(caseId).length;
      c.updatedDate = new Date().toISOString();
    }
  }

  public static getDashboardStats(caseId?: string): DashboardStats {
    const caseEntities = this.getEntities(caseId);
    const caseRelationships = this.getRelationships(caseId);
    const caseEvents = this.getEvents(caseId);
    const caseEvidence = this.getEvidenceList(caseId);

    const persons = caseEntities.filter((e) => e.poleType === 'PERSON');
    const objects = caseEntities.filter((e) => e.poleType === 'OBJECT');
    const locations = caseEntities.filter((e) => e.poleType === 'LOCATION');
    const highRisk = caseEntities.filter((e) => e.riskLevel === 'HIGH' || e.riskLevel === 'CRITICAL');

    const suspiciousTransactions = caseRelationships.filter(
      (r) => r.type === 'TRANSFERRED' && (r.amount || 0) >= 100000
    );

    const riskDistribution = {
      low: caseEntities.filter((e) => e.riskLevel === 'LOW').length,
      medium: caseEntities.filter((e) => e.riskLevel === 'MEDIUM').length,
      high: caseEntities.filter((e) => e.riskLevel === 'HIGH').length,
      critical: caseEntities.filter((e) => e.riskLevel === 'CRITICAL').length,
    };

    const entityTypeDistribution: Record<string, number> = {};
    caseEntities.forEach((e) => {
      entityTypeDistribution[e.type] = (entityTypeDistribution[e.type] || 0) + 1;
    });

    const relationshipDistribution: Record<string, number> = {};
    caseRelationships.forEach((r) => {
      relationshipDistribution[r.type] = (relationshipDistribution[r.type] || 0) + 1;
    });

    return {
      totalCases: this.cases.length,
      totalEntities: caseEntities.length,
      personsCount: persons.length,
      objectsCount: objects.length,
      locationsCount: locations.length,
      eventsCount: caseEvents.length,
      connectionsCount: caseRelationships.length,
      highRiskCount: highRisk.length,
      evidenceFilesCount: caseEvidence.length,
      suspiciousTransactionsCount: suspiciousTransactions.length,
      riskDistribution,
      entityTypeDistribution,
      relationshipDistribution,
    };
  }
}

// Automatically initialize sample evidence files and hashes
CaseStore.initialize();
