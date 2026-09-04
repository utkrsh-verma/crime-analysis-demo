export interface SampleFileItem {
  id: string;
  name: string;
  type: 'CDR_CSV' | 'BANK_CSV' | 'VEHICLE_CSV' | 'IP_LOG_CSV' | 'FIR_TXT' | 'PDF_REPORT';
  description: string;
  content: string;
}

export function buildSamplePdfBuffer(): Buffer {
  const lines = [
    'CRIMINAL INTELLIGENCE & FORENSIC DOSSIER',
    'CONFIDENTIAL - LAW ENFORCEMENT SENSITIVE',
    'CASE REF: CR-2026-DELHI-009',
    'ACCUSED & BENEFICIAL OWNERS:',
    '1. Accused: Utkarsh Verma Phone: +919811014901 Account: HDFC-88219001 Vehicle: DL-01-AB-4491',
    '2. Accused: Aryan Sharma Phone: +919871123002 Vehicle: MH-02-CP-8821',
    '3. Accused: Rahul Mehta Account: SBI-10928341',
    '4. Accused: Neha Singh Account: ICICI-44120934',
    '5. Accused: Rohan Kapoor Phone: +919820088123 Account: PNB-33829102',
    '6. Accused: Siddharth Joshi Gateway IP: 185.220.101.45',
    'CRITICAL LOCATIONS: Tower 45, Cyber City | Warehouse 12, Okhla Phase III | Safehouse B-14, Vasant Kunj',
    'SUMMARY: Coordinated multi-crore illicit transactions mapped across telecommunication intercepts.'
  ];

  const bodyOps = lines.map((l) => '(' + l.replace(/[()]/g, '') + ') Tj').join(' T* ');
  const pdfStream = 'BT /F1 9 Tf 35 730 Td 15 TL ' + bodyOps + ' ET';
  const pdfLength = Buffer.byteLength(pdfStream);

  const pdfDoc =
    '%PDF-1.4\n' +
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n' +
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n' +
    '3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n' +
    '4 0 obj << /Length ' + pdfLength + ' >> stream\n' +
    pdfStream + '\n' +
    'endstream endobj\n' +
    '5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n' +
    'xref\n' +
    '0 6\n' +
    '0000000000 65535 f \n' +
    '0000000009 00000 n \n' +
    '0000000058 00000 n \n' +
    '0000000115 00000 n \n' +
    '0000000244 00000 n \n' +
    'trailer << /Size 6 /Root 1 0 R >>\n' +
    'startxref\n' +
    '400\n' +
    '%%EOF';

  return Buffer.from(pdfDoc);
}

export const SAMPLE_FILES: Record<string, SampleFileItem> = {
  pdf_dossier: {
    id: 'pdf_dossier',
    name: 'FORENSIC_INTELLIGENCE_DOSSIER.pdf',
    type: 'PDF_REPORT',
    description: 'Official law enforcement PDF dossier with suspect profiles, cellular lines, vehicle plates, and illicit accounts.',
    content: buildSamplePdfBuffer().toString('binary'),
  },
  cdr: {
    id: 'cdr',
    name: 'CDR_EVIDENCE_SAMPLE.csv',
    type: 'CDR_CSV',
    description: 'Cellular Detail Records containing caller, receiver, call duration, timestamp, and cell tower IDs.',
    content: `caller,receiver,duration,timestamp,tower
+919811014901,+919871123002,182,2026-09-01T10:20:00Z,Tower 45 Cyber City
+919811014901,+919820088123,45,2026-09-01T10:45:00Z,Tower 45 Cyber City
+919871123002,+919910277341,32,2026-09-01T11:15:00Z,Sector 29 Hub
+919820088123,+919910277341,20,2026-09-01T11:35:00Z,Vasant Kunj B-14
+919811014901,+919711866299,12,2026-08-30T16:00:00Z,Tower 45 Cyber City
+919871123002,+919823455101,18,2026-08-31T09:10:00Z,Okhla Industrial Shed
+919811014901,+919871123002,95,2026-09-01T14:10:00Z,Tower 45 Cyber City
+919820088123,+919871123002,110,2026-09-01T15:20:00Z,Delhi South Border
+919871123002,+919910277341,40,2026-09-01T16:05:00Z,Okhla Phase 3
`
  },
  bank: {
    id: 'bank',
    name: 'BANK_TRANSACTIONS_SAMPLE.csv',
    type: 'BANK_CSV',
    description: 'Bank wire records containing sender account, receiver account, transaction amount in INR, and timestamp.',
    content: `sender_account,receiver_account,amount,timestamp
HDFC-88219001,ICICI-44120934,4500000,2026-09-01T10:35:00Z
ICICI-44120934,SBI-10928341,1850000,2026-09-01T11:00:00Z
SBI-10928341,PNB-33829102,1500000,2026-09-01T12:30:00Z
HDFC-88219001,AXIS-99238411,1200000,2026-08-31T14:20:00Z
SBI-10928341,KOTAK-55192833,350000,2026-09-01T13:00:00Z
ICICI-44120934,PNB-33829102,2800000,2026-09-02T09:40:00Z
AXIS-99238411,SBI-10928341,920000,2026-09-02T11:15:00Z
HDFC-88219001,ICICI-44120934,3100000,2026-09-02T14:50:00Z
`
  },
  vehicle: {
    id: 'vehicle',
    name: 'VEHICLE_SURVEILLANCE_SAMPLE.csv',
    type: 'VEHICLE_CSV',
    description: 'ANPR camera sightings containing vehicle ID, associated person ID, captured location, and timestamp.',
    content: `vehicle_id,person_id,location,timestamp
DL-01-AB-4491,Utkarsh Verma,Tower 45 Cyber City,2026-09-01T10:10:00Z
MH-02-CP-8821,Aryan Sharma,Warehouse 12 Okhla,2026-09-01T12:05:00Z
HR-55-JK-9941,Devendra Rana,Warehouse 12 Okhla,2026-09-01T13:30:00Z
HR-26-DQ-1190,Vikram Malhotra,Regal Plaza CP,2026-08-29T14:45:00Z
DL-01-AB-4491,Utkarsh Verma,Safehouse B-14 Vasant Kunj,2026-09-01T16:20:00Z
HR-55-JK-9941,Devendra Rana,Port Yard Gate 7 Nhava Sheva,2026-09-03T04:15:00Z
MH-02-CP-8821,Aryan Sharma,Tower 45 Cyber City,2026-09-01T10:18:00Z
`
  },
  ip: {
    id: 'ip',
    name: 'IP_SECURITY_LOGS_SAMPLE.csv',
    type: 'IP_LOG_CSV',
    description: 'Network gateway & net-banking session logs with IP address, person ID, and login timestamp.',
    content: `ip_address,person_id,timestamp
185.220.101.45,Siddharth Joshi,2026-09-01T09:45:00Z
185.220.101.45,Utkarsh Verma,2026-09-01T10:32:00Z
103.24.182.11,Siddharth Joshi,2026-09-01T11:20:00Z
45.154.255.89,Rohan Kapoor,2026-09-01T12:45:00Z
122.160.88.19,Neha Singh,2026-09-01T10:00:00Z
185.220.101.45,Aryan Sharma,2026-09-01T14:15:00Z
`
  },
  fir: {
    id: 'fir',
    name: 'FIR_SAMPLE_POLICE_STATION_CYBER_CRIME.txt',
    type: 'FIR_TXT',
    description: 'Official First Information Report narrative detailing accused persons, accounts, phones, locations, and incident events.',
    content: `FIRST INFORMATION REPORT (Under Section 154 Cr.P.C)
POLICE STATION: Cyber Crime & Economic Offences Unit, Special Cell
FIR NO: 402/2026
DATE & TIME OF REPORT: 02-SEPT-2026 11:30 HOURS
SECTIONS OF LAW: IPC Sec 420 (Cheating), 120B (Criminal Conspiracy), 468, 471 & IT Act 2000 Sec 66C, 66D

COMPLAINANT: Financial Intelligence Unit (FIU-IND) via Nodal Officer
ACCUSED / SUSPECT PERSONS:
1. Utkarsh Verma (Alias 'UV' / 'The Architect'), resident of DLF Phase 2, operating as beneficial mastermind.
2. Aryan Sharma, logistics coordinator in charge of vehicle dispatches and safehouses.
3. Rahul Mehta, mule account handler operating across Rohini and Connaught Place branches.
4. Neha Singh, nominee director of dummy firm Zenith Mercantile Ltd.
5. Rohan Kapoor, hawala courier and cash-clearing handler.
6. Siddharth Joshi, technical and darknet communication facilitator.

ASSOCIATED OBJECTS & ASSETS:
- Cellular Numbers: +919811014901 (Utkarsh Verma), +919871123002 (Aryan Sharma), +919820088123 (Rohan Kapoor).
- Bank Accounts: HDFC Bank A/C HDFC-88219001 (Orion Global Exports), ICICI Bank A/C ICICI-44120934 (Zenith Mercantile Ltd), SBI A/C SBI-10928341 (Rahul Mehta), PNB A/C PNB-33829102 (Rohan Kapoor Hawala).
- Vehicles: Black Mahindra Scorpio plate DL-01-AB-4491, White Toyota Fortuner plate MH-02-CP-8821, Heavy Truck HR-55-JK-9941.
- IP Addresses: Anonymous proxy node 185.220.101.45 and Cyber Cafe Gateway 103.24.182.11.

LOCATIONS IDENTIFIED:
- Tower 45, Cyber City Sector 29 Gurugram (Cell tower coincidence hub)
- Warehouse 12, Okhla Phase III (Primary staging depot)
- Regal Plaza Suite 402, Connaught Place (Shell front office)
- Safehouse B-14, Vasant Kunj (Hawala cash stash location)

BRIEF FACTS OF THE CASE:
On 01-SEPT-2026 between 10:00 and 13:00 hours, suspect Utkarsh Verma coordinated a series of high-frequency telephone calls to Aryan Sharma and Rohan Kapoor from the vicinity of Tower 45 Cyber City. Concurrently, a suspicious RTGS transfer of INR 45,00,000 was executed from HDFC-88219001 to ICICI-44120934 under the guise of fake software import invoicing. Within 25 minutes, secondary layering transfers of INR 18,50,000 and INR 15,00,000 were moved into mule accounts SBI-10928341 and PNB-33829102. Physical surveillance captured vehicle DL-01-AB-4491 meeting vehicle MH-02-CP-8821 near Cyber City before departing towards Warehouse 12 Okhla for freight transshipment. Intercepted IP logs confirm net-banking authentication via encrypted proxy 185.220.101.45 handled by Siddharth Joshi.

INVESTIGATION DIRECTIVES:
Freeze all named bank accounts immediately under Sec 102 Cr.P.C. Issue lookout notices for Utkarsh Verma, Aryan Sharma, and Rohan Kapoor. Seize digital media and CDR dumps for comprehensive criminal network graph mapping.
`
  }
};
