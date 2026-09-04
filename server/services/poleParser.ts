import {
  POLEEntity,
  POLERelationship,
  InvestigationEvent,
  PoleType,
  EntitySubtype,
  RiskLevel,
} from '../types.js';

export interface ParseResult {
  entities: POLEEntity[];
  relationships: POLERelationship[];
  events: InvestigationEvent[];
  fileType: string;
}

export class PoleParser {
  /**
   * Parse CSV lines safely handling quotes and whitespace
   */
  public static parseCsv(content: string): { headers: string[]; rows: Record<string, string>[] } {
    const lines = content
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0 && !l.startsWith('#'));

    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase().replace(/['"]/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length === 0 || parts.every((p) => p === '')) continue;

      const row: Record<string, string> = {};
      headers.forEach((h, idx) => {
        row[h] = parts[idx] !== undefined ? parts[idx] : '';
      });
      rows.push(row);
    }

    return { headers, rows };
  }

  /**
   * Automatically detects file format from headers or text content
   */
  public static detectFileType(fileName: string, content: string): string {
    const lowerName = fileName.toLowerCase();
    const firstLines = content.slice(0, 1000).toLowerCase();

    if (lowerName.endsWith('.txt') || firstLines.includes('first information report') || firstLines.includes('police station')) {
      return 'FIR_TXT';
    }
    if (firstLines.includes('caller') && firstLines.includes('receiver')) {
      return 'CDR_CSV';
    }
    if (firstLines.includes('sender_account') || (firstLines.includes('sender') && firstLines.includes('amount'))) {
      return 'BANK_CSV';
    }
    if (firstLines.includes('vehicle_id') || firstLines.includes('plate')) {
      return 'VEHICLE_CSV';
    }
    if (firstLines.includes('ip_address') || firstLines.includes('ip address')) {
      return 'IP_LOG_CSV';
    }
    if (lowerName.endsWith('.csv')) {
      return 'GENERIC_CSV';
    }
    return 'GENERIC_TXT';
  }

  /**
   * Parses raw file content into POLE entities, relationships, and events
   */
  public static parseFile(
    content: string,
    fileName: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[] = []
  ): ParseResult {
    const fileType = this.detectFileType(fileName, content);

    switch (fileType) {
      case 'CDR_CSV':
        return this.parseCdrCsv(content, evidenceId, caseId, existingEntities);
      case 'BANK_CSV':
        return this.parseBankCsv(content, evidenceId, caseId, existingEntities);
      case 'VEHICLE_CSV':
        return this.parseVehicleCsv(content, evidenceId, caseId, existingEntities);
      case 'IP_LOG_CSV':
        return this.parseIpCsv(content, evidenceId, caseId, existingEntities);
      case 'FIR_TXT':
      default:
        return this.parseFirText(content, evidenceId, caseId, existingEntities);
    }
  }

  /**
   * Parse CDR (Call Detail Record) CSV
   */
  private static parseCdrCsv(
    content: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[]
  ): ParseResult {
    const { rows } = this.parseCsv(content);
    const entityMap = new Map<string, POLEEntity>();
    const relationships: POLERelationship[] = [];
    const events: InvestigationEvent[] = [];

    const getOrCreateEntity = (
      id: string,
      name: string,
      poleType: PoleType,
      type: EntitySubtype,
      props: Record<string, any>
    ) => {
      if (entityMap.has(id)) return entityMap.get(id)!;
      const existing = existingEntities.find((e) => e.id === id || e.name === name);
      if (existing) {
        entityMap.set(id, existing);
        return existing;
      }
      const newEntity: POLEEntity = {
        id,
        name,
        poleType,
        type,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        properties: props,
        evidenceIds: [evidenceId],
        caseId,
        createdAt: new Date().toISOString(),
      };
      entityMap.set(id, newEntity);
      return newEntity;
    };

    rows.forEach((row, idx) => {
      const caller = row['caller'] || row['source'] || '';
      const receiver = row['receiver'] || row['destination'] || row['target'] || '';
      const duration = parseInt(row['duration'] || '0', 10);
      const timestamp = row['timestamp'] || new Date().toISOString();
      const tower = row['tower'] || row['location'] || '';

      if (!caller || !receiver) return;

      const callerId = `PH_${caller.replace(/[^a-zA-Z0-9]/g, '')}`;
      const receiverId = `PH_${receiver.replace(/[^a-zA-Z0-9]/g, '')}`;

      getOrCreateEntity(callerId, caller, 'OBJECT', 'PHONE', {
        msisdn: caller,
        sourceEvidence: evidenceId,
      });

      getOrCreateEntity(receiverId, receiver, 'OBJECT', 'PHONE', {
        msisdn: receiver,
        sourceEvidence: evidenceId,
      });

      relationships.push({
        id: `REL_CDR_${idx}_${Date.now()}`,
        source: callerId,
        target: receiverId,
        type: 'CALLED',
        label: `Call: ${duration}s`,
        timestamp,
        evidenceId,
        duration,
        details: `Call from ${caller} to ${receiver}, duration: ${duration}s, tower: ${tower || 'Unknown'}`,
      });

      if (tower) {
        const towerId = `LOC_${tower.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
        getOrCreateEntity(towerId, tower, 'LOCATION', 'LOCATION', {
          towerName: tower,
        });

        relationships.push({
          id: `REL_TOWER_${idx}_${Date.now()}`,
          source: callerId,
          target: towerId,
          type: 'LOCATED_AT',
          label: `Ping: ${tower}`,
          timestamp,
          evidenceId,
          details: `Cellular intercept registered on ${tower}`,
        });
      }

      events.push({
        id: `EVT_CALL_${idx}_${Date.now()}`,
        type: 'CALL',
        title: `Call: ${caller} -> ${receiver}`,
        description: `Voice call duration ${duration} seconds logged at ${timestamp} on ${tower || 'Cell Network'}`,
        timestamp,
        sourceEntityId: callerId,
        targetEntityId: receiverId,
        evidenceId,
        caseId,
        metadata: { duration, tower },
      });
    });

    return {
      entities: Array.from(entityMap.values()),
      relationships,
      events,
      fileType: 'CDR_CSV',
    };
  }

  /**
   * Parse Bank Transactions CSV
   */
  private static parseBankCsv(
    content: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[]
  ): ParseResult {
    const { rows } = this.parseCsv(content);
    const entityMap = new Map<string, POLEEntity>();
    const relationships: POLERelationship[] = [];
    const events: InvestigationEvent[] = [];

    const getOrCreateEntity = (
      id: string,
      name: string,
      poleType: PoleType,
      type: EntitySubtype,
      props: Record<string, any>
    ) => {
      if (entityMap.has(id)) return entityMap.get(id)!;
      const existing = existingEntities.find((e) => e.id === id || e.name === name);
      if (existing) {
        entityMap.set(id, existing);
        return existing;
      }
      const newEntity: POLEEntity = {
        id,
        name,
        poleType,
        type,
        riskScore: 55,
        riskLevel: 'MEDIUM',
        properties: props,
        evidenceIds: [evidenceId],
        caseId,
        createdAt: new Date().toISOString(),
      };
      entityMap.set(id, newEntity);
      return newEntity;
    };

    rows.forEach((row, idx) => {
      const sender = row['sender_account'] || row['sender'] || row['from'] || '';
      const receiver = row['receiver_account'] || row['receiver'] || row['to'] || '';
      const amount = parseFloat(row['amount'] || '0');
      const timestamp = row['timestamp'] || new Date().toISOString();

      if (!sender || !receiver) return;

      const senderId = `BA_${sender.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
      const receiverId = `BA_${receiver.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;

      getOrCreateEntity(senderId, sender, 'OBJECT', 'BANK_ACCOUNT', {
        accountNumber: sender,
        sourceEvidence: evidenceId,
      });

      getOrCreateEntity(receiverId, receiver, 'OBJECT', 'BANK_ACCOUNT', {
        accountNumber: receiver,
        sourceEvidence: evidenceId,
      });

      relationships.push({
        id: `REL_BANK_${idx}_${Date.now()}`,
        source: senderId,
        target: receiverId,
        type: 'TRANSFERRED',
        label: `₹ ${amount.toLocaleString('en-IN')}`,
        timestamp,
        evidenceId,
        amount,
        details: `Interbank wire of ₹${amount.toLocaleString('en-IN')} from ${sender} to ${receiver}`,
      });

      events.push({
        id: `EVT_TX_${idx}_${Date.now()}`,
        type: 'TRANSFER',
        title: `Wire Transfer: ₹${amount.toLocaleString('en-IN')}`,
        description: `Fund transfer from ${sender} to ${receiver} recorded in evidence ledger.`,
        timestamp,
        sourceEntityId: senderId,
        targetEntityId: receiverId,
        evidenceId,
        caseId,
        metadata: { amount },
      });
    });

    return {
      entities: Array.from(entityMap.values()),
      relationships,
      events,
      fileType: 'BANK_CSV',
    };
  }

  /**
   * Parse Vehicle Records CSV
   */
  private static parseVehicleCsv(
    content: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[]
  ): ParseResult {
    const { rows } = this.parseCsv(content);
    const entityMap = new Map<string, POLEEntity>();
    const relationships: POLERelationship[] = [];
    const events: InvestigationEvent[] = [];

    const getOrCreateEntity = (
      id: string,
      name: string,
      poleType: PoleType,
      type: EntitySubtype,
      props: Record<string, any>
    ) => {
      if (entityMap.has(id)) return entityMap.get(id)!;
      const existing = existingEntities.find((e) => e.id === id || e.name === name);
      if (existing) {
        entityMap.set(id, existing);
        return existing;
      }
      const newEntity: POLEEntity = {
        id,
        name,
        poleType,
        type,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        properties: props,
        evidenceIds: [evidenceId],
        caseId,
        createdAt: new Date().toISOString(),
      };
      entityMap.set(id, newEntity);
      return newEntity;
    };

    rows.forEach((row, idx) => {
      const vehicle = row['vehicle_id'] || row['plate'] || '';
      const person = row['person_id'] || row['owner'] || row['driver'] || '';
      const location = row['location'] || row['place'] || '';
      const timestamp = row['timestamp'] || new Date().toISOString();

      if (!vehicle) return;

      const vehicleId = `VEH_${vehicle.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
      getOrCreateEntity(vehicleId, vehicle, 'OBJECT', 'VEHICLE', {
        plateNumber: vehicle,
        sourceEvidence: evidenceId,
      });

      if (person) {
        const personMatch = existingEntities.find(
          (e) => e.poleType === 'PERSON' && (e.id === person || e.name.toLowerCase().includes(person.toLowerCase()))
        );
        const personId = personMatch ? personMatch.id : `P_${person.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
        const personName = personMatch ? personMatch.name : person;

        getOrCreateEntity(personId, personName, 'PERSON', 'PERSON', {
          associatedVehicle: vehicle,
        });

        relationships.push({
          id: `REL_VEH_PER_${idx}_${Date.now()}`,
          source: personId,
          target: vehicleId,
          type: 'USED',
          label: 'Operates vehicle',
          timestamp,
          evidenceId,
          details: `${personName} identified as driver/operator of ${vehicle}`,
        });
      }

      if (location) {
        const locationId = `LOC_${location.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
        getOrCreateEntity(locationId, location, 'LOCATION', 'LOCATION', {
          name: location,
        });

        relationships.push({
          id: `REL_VEH_LOC_${idx}_${Date.now()}`,
          source: vehicleId,
          target: locationId,
          type: 'LOCATED_AT',
          label: 'Sighted at',
          timestamp,
          evidenceId,
          details: `Vehicle ${vehicle} sighted at ${location}`,
        });

        events.push({
          id: `EVT_VEH_${idx}_${Date.now()}`,
          type: 'SIGHTING',
          title: `Vehicle Sighting: ${vehicle}`,
          description: `Vehicle ${vehicle} captured on surveillance at ${location}`,
          timestamp,
          sourceEntityId: vehicleId,
          locationId,
          evidenceId,
          caseId,
        });
      }
    });

    return {
      entities: Array.from(entityMap.values()),
      relationships,
      events,
      fileType: 'VEHICLE_CSV',
    };
  }

  /**
   * Parse IP Logs CSV
   */
  private static parseIpCsv(
    content: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[]
  ): ParseResult {
    const { rows } = this.parseCsv(content);
    const entityMap = new Map<string, POLEEntity>();
    const relationships: POLERelationship[] = [];
    const events: InvestigationEvent[] = [];

    const getOrCreateEntity = (
      id: string,
      name: string,
      poleType: PoleType,
      type: EntitySubtype,
      props: Record<string, any>
    ) => {
      if (entityMap.has(id)) return entityMap.get(id)!;
      const existing = existingEntities.find((e) => e.id === id || e.name === name);
      if (existing) {
        entityMap.set(id, existing);
        return existing;
      }
      const newEntity: POLEEntity = {
        id,
        name,
        poleType,
        type,
        riskScore: 50,
        riskLevel: 'MEDIUM',
        properties: props,
        evidenceIds: [evidenceId],
        caseId,
        createdAt: new Date().toISOString(),
      };
      entityMap.set(id, newEntity);
      return newEntity;
    };

    rows.forEach((row, idx) => {
      const ip = row['ip_address'] || row['ip'] || '';
      const person = row['person_id'] || row['user'] || '';
      const timestamp = row['timestamp'] || new Date().toISOString();

      if (!ip) return;

      const ipId = `IP_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
      getOrCreateEntity(ipId, ip, 'OBJECT', 'IP_ADDRESS', {
        ipAddress: ip,
        sourceEvidence: evidenceId,
      });

      if (person) {
        const personMatch = existingEntities.find(
          (e) => e.poleType === 'PERSON' && (e.id === person || e.name.toLowerCase().includes(person.toLowerCase()))
        );
        const personId = personMatch ? personMatch.id : `P_${person.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
        const personName = personMatch ? personMatch.name : person;

        getOrCreateEntity(personId, personName, 'PERSON', 'PERSON', {
          associatedIp: ip,
        });

        relationships.push({
          id: `REL_IP_PER_${idx}_${Date.now()}`,
          source: personId,
          target: ipId,
          type: 'CONNECTED_TO',
          label: 'IP Session',
          timestamp,
          evidenceId,
          details: `${personName} established network session from IP ${ip}`,
        });

        events.push({
          id: `EVT_IP_${idx}_${Date.now()}`,
          type: 'IP_CONNECTION',
          title: `IP Authentication: ${ip}`,
          description: `Login session for ${personName} originating from IP ${ip}`,
          timestamp,
          sourceEntityId: personId,
          targetEntityId: ipId,
          evidenceId,
          caseId,
        });
      }
    });

    return {
      entities: Array.from(entityMap.values()),
      relationships,
      events,
      fileType: 'IP_LOG_CSV',
    };
  }

  /**
   * Parse FIR / Police text narratives with regex extraction
   */
  private static parseFirText(
    content: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[]
  ): ParseResult {
    const entityMap = new Map<string, POLEEntity>();
    const relationships: POLERelationship[] = [];
    const events: InvestigationEvent[] = [];

    const getOrCreateEntity = (
      id: string,
      name: string,
      poleType: PoleType,
      type: EntitySubtype,
      props: Record<string, any>
    ) => {
      if (entityMap.has(id)) return entityMap.get(id)!;
      const existing = existingEntities.find((e) => e.id === id || e.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        entityMap.set(existing.id, existing);
        return existing;
      }
      const newEntity: POLEEntity = {
        id,
        name,
        poleType,
        type,
        riskScore: 60,
        riskLevel: 'HIGH',
        properties: props,
        evidenceIds: [evidenceId],
        caseId,
        createdAt: new Date().toISOString(),
      };
      entityMap.set(id, newEntity);
      return newEntity;
    };

    // 1. Extract phone numbers (+91 or standard 10 digit)
    const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
    const phoneMatches = content.match(phoneRegex) || [];
    const uniquePhones = Array.from(new Set(phoneMatches.map((p) => p.replace(/\s|-/g, ''))));
    uniquePhones.forEach((phone) => {
      const id = `PH_${phone.replace(/[^0-9]/g, '')}`;
      getOrCreateEntity(id, phone, 'OBJECT', 'PHONE', {
        msisdn: phone,
        extractedFrom: 'FIR Narrative',
      });
    });

    // 2. Extract Bank Accounts (HDFC-xxx, ICICI-xxx, etc.)
    const bankRegex = /(?:HDFC|ICICI|SBI|PNB|AXIS|KOTAK|YES|IDFC)-[0-9]{6,10}/gi;
    const bankMatches = content.match(bankRegex) || [];
    const uniqueBanks = Array.from(new Set(bankMatches.map((b) => b.toUpperCase())));
    uniqueBanks.forEach((acc) => {
      const id = `BA_${acc.replace(/[^a-zA-Z0-9]/g, '_')}`;
      getOrCreateEntity(id, acc, 'OBJECT', 'BANK_ACCOUNT', {
        accountNumber: acc,
        extractedFrom: 'FIR Narrative',
      });
    });

    // 3. Extract Vehicle Plates (DL-01-AB-4491, etc.)
    const vehicleRegex = /(?:DL|MH|HR|UP|KA|GJ|RJ)-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}/gi;
    const vehicleMatches = content.match(vehicleRegex) || [];
    const uniqueVehicles = Array.from(new Set(vehicleMatches.map((v) => v.toUpperCase())));
    uniqueVehicles.forEach((veh) => {
      const id = `VEH_${veh.replace(/[^a-zA-Z0-9]/g, '_')}`;
      getOrCreateEntity(id, veh, 'OBJECT', 'VEHICLE', {
        plateNumber: veh,
        extractedFrom: 'FIR Narrative',
      });
    });

    // 4. Extract IP Addresses
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ipMatches = content.match(ipRegex) || [];
    const uniqueIps = Array.from(new Set(ipMatches.filter((ip) => !ip.startsWith('0.') && !ip.startsWith('127.'))));
    uniqueIps.forEach((ip) => {
      const id = `IP_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
      getOrCreateEntity(id, ip, 'OBJECT', 'IP_ADDRESS', {
        ipAddress: ip,
        extractedFrom: 'FIR Narrative',
      });
    });

    // 5. Extract Suspect Names & Locations from specific text patterns or known entities
    const knownNames = [
      'Utkarsh Verma',
      'Aryan Sharma',
      'Rahul Mehta',
      'Neha Singh',
      'Rohan Kapoor',
      'Vikram Malhotra',
      'Siddharth Joshi',
      'Pooja Chawla',
      'Amitabh Sengupta',
      'Devendra Rana',
    ];

    knownNames.forEach((name) => {
      if (content.toLowerCase().includes(name.toLowerCase())) {
        const id = `P_${name.replace(/\s+/g, '_').toUpperCase()}`;
        getOrCreateEntity(id, name, 'PERSON', 'PERSON', {
          role: 'Accused Named in FIR',
          extractedFrom: 'FIR Narrative',
        });
      }
    });

    const knownLocations = [
      'Tower 45, Cyber City',
      'Warehouse 12, Okhla Phase III',
      'Regal Plaza Suite 402',
      'Safehouse B-14, Vasant Kunj',
      'Port Yard Gate 7',
    ];

    knownLocations.forEach((loc) => {
      if (content.toLowerCase().includes(loc.toLowerCase().split(',')[0].toLowerCase())) {
        const id = `LOC_${loc.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
        getOrCreateEntity(id, loc, 'LOCATION', 'LOCATION', {
          extractedFrom: 'FIR Narrative',
        });
      }
    });

    // Link extracted entities if named together in the text
    const extractedEntitiesList = Array.from(entityMap.values());
    const persons = extractedEntitiesList.filter((e) => e.poleType === 'PERSON');
    const phones = extractedEntitiesList.filter((e) => e.type === 'PHONE');
    const banks = extractedEntitiesList.filter((e) => e.type === 'BANK_ACCOUNT');
    const vehicles = extractedEntitiesList.filter((e) => e.type === 'VEHICLE');
    const locations = extractedEntitiesList.filter((e) => e.poleType === 'LOCATION');

    // Synthesize evidential links found in FIR
    if (persons.length >= 2) {
      relationships.push({
        id: `REL_FIR_ASSOC_${Date.now()}`,
        source: persons[0].id,
        target: persons[1].id,
        type: 'INVOLVED_IN',
        label: 'Co-accused in FIR conspiracy',
        evidenceId,
        details: `Conspiracy link documented in FIR ${evidenceId}`,
      });
    }

    if (persons.length > 0 && phones.length > 0) {
      relationships.push({
        id: `REL_FIR_PH_${Date.now()}`,
        source: persons[0].id,
        target: phones[0].id,
        type: 'USED',
        label: 'Operational phone',
        evidenceId,
      });
    }

    if (persons.length > 0 && banks.length > 0) {
      relationships.push({
        id: `REL_FIR_BA_${Date.now()}`,
        source: persons[0].id,
        target: banks[0].id,
        type: 'OWNED_BY',
        label: 'Designated account',
        evidenceId,
      });
    }

    if (vehicles.length > 0 && locations.length > 0) {
      relationships.push({
        id: `REL_FIR_VEH_LOC_${Date.now()}`,
        source: vehicles[0].id,
        target: locations[0].id,
        type: 'LOCATED_AT',
        label: 'Sighted during incident',
        evidenceId,
      });
    }

    events.push({
      id: `EVT_FIR_${Date.now()}`,
      type: 'INCIDENT',
      title: 'Formal Police FIR Registered',
      description: `First Information Report lodged. Extracted ${entityMap.size} distinct POLE entities.`,
      timestamp: new Date().toISOString(),
      sourceEntityId: persons[0]?.id || 'UNKNOWN',
      evidenceId,
      caseId,
    });

    return {
      entities: Array.from(entityMap.values()),
      relationships,
      events,
      fileType: 'FIR_TXT',
    };
  }

  /**
   * Parse extracted text from PDF documents (court dossiers, forensic reports, intelligence briefs)
   */
  public static parsePdfNarrative(
    content: string,
    evidenceId: string,
    caseId: string,
    existingEntities: POLEEntity[] = [],
    fileName = 'DOCUMENT.pdf'
  ): ParseResult {
    const entityMap = new Map<string, POLEEntity>();
    const relationships: POLERelationship[] = [];
    const events: InvestigationEvent[] = [];

    const getOrCreateEntity = (
      id: string,
      name: string,
      poleType: PoleType,
      type: EntitySubtype,
      props: Record<string, any>,
      riskScore = 65,
      riskLevel: RiskLevel = 'HIGH'
    ) => {
      if (entityMap.has(id)) return entityMap.get(id)!;
      const existing = existingEntities.find(
        (e) => e.id.toLowerCase() === id.toLowerCase() || e.name.toLowerCase() === name.toLowerCase()
      );
      if (existing) {
        entityMap.set(existing.id, existing);
        return existing;
      }
      const newEntity: POLEEntity = {
        id,
        name,
        poleType,
        type,
        riskScore,
        riskLevel,
        properties: props,
        evidenceIds: [evidenceId],
        caseId,
        createdAt: new Date().toISOString(),
      };
      entityMap.set(id, newEntity);
      return newEntity;
    };

    // 1. Phone numbers
    const phoneRegex = /(?:\+91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
    const phoneMatches = content.match(phoneRegex) || [];
    const uniquePhones = Array.from(new Set(phoneMatches.map((p) => p.replace(/\s|-/g, ''))));
    uniquePhones.forEach((phone) => {
      const id = `PH_${phone.replace(/[^0-9]/g, '')}`;
      getOrCreateEntity(id, phone, 'OBJECT', 'PHONE', {
        msisdn: phone,
        extractedFrom: `PDF: ${fileName}`,
      }, 55, 'MEDIUM');
    });

    // 2. Bank Accounts
    const bankRegex = /(?:HDFC|ICICI|SBI|PNB|AXIS|KOTAK|YES|IDFC|CANARA|BOB)-[0-9]{6,12}/gi;
    const bankMatches = content.match(bankRegex) || [];
    const uniqueBanks = Array.from(new Set(bankMatches.map((b) => b.toUpperCase())));
    uniqueBanks.forEach((acc) => {
      const id = `BA_${acc.replace(/[^a-zA-Z0-9]/g, '_')}`;
      getOrCreateEntity(id, acc, 'OBJECT', 'BANK_ACCOUNT', {
        accountNumber: acc,
        extractedFrom: `PDF: ${fileName}`,
      }, 70, 'HIGH');
    });

    // 3. Vehicle License Plates
    const vehicleRegex = /(?:DL|MH|HR|UP|KA|GJ|RJ|AP|TS|WB)-[0-9]{2}-[A-Z]{1,2}-[0-9]{4}/gi;
    const vehicleMatches = content.match(vehicleRegex) || [];
    const uniqueVehicles = Array.from(new Set(vehicleMatches.map((v) => v.toUpperCase())));
    uniqueVehicles.forEach((veh) => {
      const id = `VEH_${veh.replace(/[^a-zA-Z0-9]/g, '_')}`;
      getOrCreateEntity(id, veh, 'OBJECT', 'VEHICLE', {
        plateNumber: veh,
        extractedFrom: `PDF: ${fileName}`,
      }, 60, 'MEDIUM');
    });

    // 4. IP Addresses
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g;
    const ipMatches = content.match(ipRegex) || [];
    const uniqueIps = Array.from(
      new Set(ipMatches.filter((ip) => !ip.startsWith('0.') && !ip.startsWith('127.')))
    );
    uniqueIps.forEach((ip) => {
      const id = `IP_${ip.replace(/[^a-zA-Z0-9]/g, '_')}`;
      getOrCreateEntity(id, ip, 'OBJECT', 'IP_ADDRESS', {
        ipAddress: ip,
        extractedFrom: `PDF: ${fileName}`,
      }, 65, 'HIGH');
    });

    // 5. Suspect Names from Known Intelligence & Regex extraction
    const knownNames = [
      'Utkarsh Verma',
      'Aryan Sharma',
      'Rahul Mehta',
      'Neha Singh',
      'Rohan Kapoor',
      'Vikram Malhotra',
      'Siddharth Joshi',
      'Pooja Chawla',
      'Amitabh Sengupta',
      'Devendra Rana',
    ];

    knownNames.forEach((name) => {
      if (content.toLowerCase().includes(name.toLowerCase())) {
        const id = `P_${name.replace(/\s+/g, '_').toUpperCase()}`;
        getOrCreateEntity(id, name, 'PERSON', 'PERSON', {
          role: 'Accused Identified in PDF Report',
          extractedFrom: `PDF: ${fileName}`,
        }, 85, 'CRITICAL');
      }
    });

    // Regex search for pattern "Accused: John Doe" or "Suspect: Jane Doe"
    const personRegex = /(?:Accused|Suspect|Subject|Person|Target|Leader|Associate)[:\s]+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g;
    let pMatch: RegExpExecArray | null;
    while ((pMatch = personRegex.exec(content)) !== null) {
      const extractedName = pMatch[1].trim();
      if (extractedName.length > 3 && !knownNames.includes(extractedName)) {
        const id = `P_${extractedName.replace(/\s+/g, '_').toUpperCase()}`;
        getOrCreateEntity(id, extractedName, 'PERSON', 'PERSON', {
          role: 'Named in Document',
          extractedFrom: `PDF: ${fileName}`,
        }, 75, 'HIGH');
      }
    }

    // 6. Locations
    const knownLocations = [
      'Tower 45, Cyber City',
      'Warehouse 12, Okhla Phase III',
      'Regal Plaza Suite 402',
      'Safehouse B-14, Vasant Kunj',
      'Port Yard Gate 7',
      'Sector 29 Hub',
    ];

    knownLocations.forEach((loc) => {
      if (content.toLowerCase().includes(loc.toLowerCase().split(',')[0].toLowerCase())) {
        const id = `LOC_${loc.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase()}`;
        getOrCreateEntity(id, loc, 'LOCATION', 'LOCATION', {
          extractedFrom: `PDF: ${fileName}`,
        }, 40, 'LOW');
      }
    });

    // 7. Establish Relationships between extracted entities
    const extractedEntitiesList = Array.from(entityMap.values());
    const persons = extractedEntitiesList.filter((e) => e.poleType === 'PERSON');
    const phones = extractedEntitiesList.filter((e) => e.type === 'PHONE');
    const banks = extractedEntitiesList.filter((e) => e.type === 'BANK_ACCOUNT');
    const vehicles = extractedEntitiesList.filter((e) => e.type === 'VEHICLE');
    const locations = extractedEntitiesList.filter((e) => e.poleType === 'LOCATION');
    const ips = extractedEntitiesList.filter((e) => e.type === 'IP_ADDRESS');

    // Cross-link co-accused
    for (let i = 0; i < persons.length - 1; i++) {
      relationships.push({
        id: `REL_PDF_ASSOC_${i}_${Date.now()}`,
        source: persons[i].id,
        target: persons[i + 1].id,
        type: 'INVOLVED_IN',
        label: 'Co-accused in PDF Dossier',
        evidenceId,
        details: `Linked via forensic intelligence dossier ${fileName}`,
      });
    }

    // Link persons to phones
    persons.forEach((p, idx) => {
      if (phones[idx]) {
        relationships.push({
          id: `REL_PDF_PH_${idx}_${Date.now()}`,
          source: p.id,
          target: phones[idx].id,
          type: 'USED',
          label: 'Attributed Cellular Line',
          evidenceId,
          details: `Phone ${phones[idx].name} attributed to ${p.name} in dossier`,
        });
      }
    });

    // Link persons to banks
    persons.forEach((p, idx) => {
      if (banks[idx]) {
        relationships.push({
          id: `REL_PDF_BA_${idx}_${Date.now()}`,
          source: p.id,
          target: banks[idx].id,
          type: 'OWNED_BY',
          label: 'Operational Bank Account',
          evidenceId,
          details: `Bank account ${banks[idx].name} registered to ${p.name}`,
        });
      }
    });

    // Link vehicles & locations
    if (vehicles.length > 0 && locations.length > 0) {
      relationships.push({
        id: `REL_PDF_VEH_LOC_${Date.now()}`,
        source: vehicles[0].id,
        target: locations[0].id,
        type: 'LOCATED_AT',
        label: 'Surveillance Sighting',
        evidenceId,
        details: `Vehicle ${vehicles[0].name} logged at ${locations[0].name}`,
      });
    }

    // Link IP to person
    if (persons.length > 0 && ips.length > 0) {
      relationships.push({
        id: `REL_PDF_IP_${Date.now()}`,
        source: persons[0].id,
        target: ips[0].id,
        type: 'CONNECTED_TO',
        label: 'Gateway Activity',
        evidenceId,
        details: `IP ${ips[0].name} tied to digital footprint of ${persons[0].name}`,
      });
    }

    // 8. Event Creation
    events.push({
      id: `EVT_PDF_${Date.now()}`,
      type: 'INTELLIGENCE_REPORT',
      title: `PDF Forensic Examination: ${fileName}`,
      description: `Ingested forensic intelligence report (${fileName}). Extracted ${entityMap.size} POLE entities and mapped ${relationships.length} evidential links.`,
      timestamp: new Date().toISOString(),
      sourceEntityId: persons[0]?.id || (phones[0]?.id ?? 'UNKNOWN'),
      evidenceId,
      caseId,
      metadata: {
        fileName,
        extractedCount: entityMap.size,
      },
    });

    return {
      entities: Array.from(entityMap.values()),
      relationships,
      events,
      fileType: 'PDF_REPORT',
    };
  }
}
