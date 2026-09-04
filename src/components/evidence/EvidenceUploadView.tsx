import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  PhoneCall,
  Landmark,
  Car,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Sparkles,
  Eye,
  ScanText,
  X,
  FileSearch,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';
import { InvestigationApi } from '../../api/client.js';

export const EvidenceUploadView: React.FC = () => {
  const { evidence, activeCaseId, refreshAllData, setActiveTab, setSelectedEvidenceForVerify } =
    useInvestigationStore();

  const [samples, setSamples] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);
  const [, setSelectedFile] = useState<File | null>(null);

  // OCR Inspector State
  const [ocrInspectionData, setOcrInspectionData] = useState<{
    evidenceId: string;
    fileName: string;
    pageCount: number;
    ocrApplied: boolean;
    rawText: string;
    metadata: Record<string, any>;
    extractedEntitiesCount: number;
    extractedRelationshipsCount: number;
  } | null>(null);
  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrSearchFilter, setOcrSearchFilter] = useState('');

  useEffect(() => {
    InvestigationApi.getSampleFiles().then(setSamples).catch(console.error);
  }, []);

  const handleFileUpload = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('caseId', activeCaseId);

    try {
      const res = await InvestigationApi.uploadEvidence(formData);
      const isPdf = file.name.toLowerCase().endsWith('.pdf');
      setUploadSuccess(
        `Successfully ingested ${file.name}${isPdf ? ' (PDF Document)' : ''}. Extracted ${res.extracted.entitiesCount} POLE entities and ${res.extracted.relationshipsCount} relationships with SHA-256 genesis hash verified.`
      );
      await refreshAllData();
    } catch (err: any) {
      setUploadError(err.response?.data?.details || err.message);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
    }
  };

  const handleLoadSample = async (sampleId: string) => {
    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    try {
      const res = await InvestigationApi.loadSampleFile(sampleId, activeCaseId);
      setUploadSuccess(
        `Sample dataset loaded successfully! Ingested ${res.extracted.entitiesCount} entities and ${res.extracted.relationshipsCount} relationships into case graph.`
      );
      await refreshAllData();
    } catch (err: any) {
      setUploadError(err.response?.data?.details || err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleInspectOcr = async (evidenceId: string) => {
    setIsOcrLoading(true);
    setOcrSearchFilter('');
    try {
      const data = await InvestigationApi.inspectPdfOcr(evidenceId);
      setOcrInspectionData(data);
    } catch (err: any) {
      console.error('OCR inspection failed:', err);
    } finally {
      setIsOcrLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const getSampleIcon = (type: string) => {
    if (type === 'PDF_REPORT') return <FileText className="w-5 h-5 text-rose-400" />;
    if (type === 'CDR' || type === 'CDR_CSV') return <PhoneCall className="w-5 h-5 text-emerald-400" />;
    if (type === 'BANK_STATEMENT' || type === 'BANK_CSV') return <Landmark className="w-5 h-5 text-purple-400" />;
    if (type === 'VEHICLE_LOG' || type === 'VEHICLE_CSV') return <Car className="w-5 h-5 text-cyan-400" />;
    return <FileSpreadsheet className="w-5 h-5 text-amber-400" />;
  };

  return (
    <div id="evidence-upload-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-semibold">
            FORENSIC INTAKE & OCR
          </span>
          <span className="text-xs text-slate-400 font-mono">
            Active Case: {activeCaseId}
          </span>
        </div>
        <h1 className="text-xl font-bold font-display text-slate-100">
          Raw Evidence Intake, PDF OCR & Automated POLE Extraction
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Upload telecommunication CDR logs, banking statements, motor vehicle database records, police FIR narratives, or court intelligence PDF dossiers.
          Every file is cryptographically stamped with a SHA-256 checksum and parsed into Person, Object, Location, and Event nodes.
        </p>
      </div>

      {/* Upload Alerts */}
      {uploadSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Evidence Ingested:</span> {uploadSuccess}
          </div>
        </div>
      )}

      {uploadError && (
        <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-300 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold">Processing Failed:</span> {uploadError}
          </div>
        </div>
      )}

      {/* Two Column Layout: Dropzone vs Sample Data Injectors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive File Upload Area */}
        <div className="lg:col-span-2 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                handleFileUpload(e.dataTransfer.files[0]);
              }
            }}
            className="border-2 border-dashed border-slate-800 hover:border-cyan-600/70 bg-slate-900/50 hover:bg-slate-900/80 rounded-2xl p-8 text-center transition-all flex flex-col items-center justify-center cursor-pointer group"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800/80 group-hover:bg-cyan-950/60 border border-slate-700 group-hover:border-cyan-700/60 flex items-center justify-center text-slate-400 group-hover:text-cyan-400 transition-colors mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-slate-200 group-hover:text-cyan-300">
              Drag & Drop Evidence Files Here
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Supports <span className="text-rose-400 font-medium">PDF Documents</span> (with automated OCR text extraction), CSV, TXT, CDR logs, Bank records, and Police FIR narratives (up to 15MB)
            </p>

            <div className="mt-4 flex items-center gap-2">
              <label
                htmlFor="file-upload-input"
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold shadow-md transition-colors cursor-pointer"
              >
                Browse Files
              </label>
              <input
                id="file-upload-input"
                type="file"
                accept=".pdf,.csv,.txt,.json,.tsv"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
                className="hidden"
              />
            </div>

            {isUploading && (
              <div className="mt-4 flex items-center gap-2 text-xs text-cyan-400 font-mono">
                <Sparkles className="w-3.5 h-3.5 animate-spin" />
                <span>Hashing SHA-256 & Parsing POLE Entities via pdf-parse & OCR...</span>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Sample Dataset Ingestion */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Synthetic Evidence Datasets
            </h3>
            <span className="text-[10px] text-cyan-400 font-mono">One-Click Ingest</span>
          </div>

          <div className="space-y-2.5">
            {samples.map((sample) => (
              <div
                key={sample.id}
                className={`p-3 rounded-xl border transition-colors flex items-center justify-between ${
                  sample.type === 'PDF_REPORT'
                    ? 'bg-rose-950/20 border-rose-900/40 hover:border-rose-700/60'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                    {getSampleIcon(sample.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-bold text-slate-200">{sample.name}</h4>
                      {sample.type === 'PDF_REPORT' && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-mono font-semibold">
                          PDF OCR
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-400 line-clamp-1">{sample.description}</p>
                  </div>
                </div>

                <button
                  onClick={() => handleLoadSample(sample.id)}
                  disabled={isUploading}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-300 text-xs font-medium border border-slate-700 transition-colors shrink-0 cursor-pointer"
                >
                  Load
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Evidence Files Vault Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Evidence Vault & Chain of Custody</h2>
            <p className="text-xs text-slate-400">
              Cryptographically registered evidence files associated with active investigation dossiers
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {evidence.length} Registered Records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
              <tr>
                <th className="px-4 py-3">File Name</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">SHA-256 Genesis Hash</th>
                <th className="px-4 py-3">POLE Extracted</th>
                <th className="px-4 py-3">Integrity</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {evidence.map((ev) => (
                <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-200">
                    <div className="flex items-center gap-2">
                      {ev.fileType === 'PDF_REPORT' || ev.fileName.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="w-4 h-4 text-rose-400 shrink-0" />
                      ) : (
                        <FileSpreadsheet className="w-4 h-4 text-cyan-400 shrink-0" />
                      )}
                      <span>{ev.fileName}</span>
                      {ev.fileType === 'PDF_REPORT' && (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-800">
                          {ev.pageCount ? `${ev.pageCount}p` : 'PDF'}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400 text-[11px]">
                    {ev.fileType}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {(ev.fileSize / 1024).toFixed(1)} KB
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px]">
                        {ev.sha256.slice(0, 10)}...{ev.sha256.slice(-8)}
                      </span>
                      <button
                        onClick={() => copyToClipboard(ev.sha256)}
                        title="Copy full SHA-256"
                        className="text-slate-500 hover:text-slate-300 p-0.5 cursor-pointer"
                      >
                        {copiedHash === ev.sha256 ? (
                          <Check className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    <span className="text-emerald-400 font-semibold">{ev.entitiesExtracted} Entities</span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-indigo-400">{ev.relationshipsExtracted} Edges</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded font-mono font-semibold ${
                        ev.verificationStatus === 'VERIFIED'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {ev.verificationStatus === 'VERIFIED' ? (
                        <>
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          <span>VERIFIED</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>TAMPERED</span>
                        </>
                      )}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex items-center gap-2">
                      {(ev.fileType === 'PDF_REPORT' || ev.fileName.toLowerCase().endsWith('.pdf')) && (
                        <button
                          onClick={() => handleInspectOcr(ev.id)}
                          disabled={isOcrLoading}
                          className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 text-xs font-medium border border-rose-800 transition-colors inline-flex items-center gap-1 cursor-pointer"
                          title="Inspect Extracted PDF OCR Text"
                        >
                          <ScanText className="w-3 h-3 text-rose-400" />
                          <span>Inspect OCR</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setSelectedEvidenceForVerify(ev.id);
                          setActiveTab('verify');
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <span>Verify Audit</span>
                        <ArrowRight className="w-3 h-3 text-cyan-400" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* PDF OCR Inspection Modal */}
      {ocrInspectionData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-950/80 border border-rose-800 text-rose-300">
                  <FileSearch className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                    <span>PDF OCR Text Extraction</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {ocrInspectionData.fileName}
                    </span>
                  </h3>
                  <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5 font-mono">
                    <span>{ocrInspectionData.pageCount} page(s)</span>
                    <span>•</span>
                    <span className="text-emerald-400">
                      {ocrInspectionData.extractedEntitiesCount} POLE Entities Mapped
                    </span>
                    <span>•</span>
                    <span className="text-indigo-400">
                      {ocrInspectionData.extractedRelationshipsCount} Graph Links
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setOcrInspectionData(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Search Bar */}
            <div className="p-3 border-b border-slate-800 bg-slate-900/60 flex items-center gap-2">
              <Eye className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Filter extracted text (phone, accused name, account, plate)..."
                value={ocrSearchFilter}
                onChange={(e) => setOcrSearchFilter(e.target.value)}
                className="bg-transparent border-none text-xs text-slate-200 placeholder-slate-500 focus:outline-none flex-1 font-mono"
              />
              {ocrSearchFilter && (
                <button
                  onClick={() => setOcrSearchFilter('')}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Extracted Text Body */}
            <div className="p-4 overflow-y-auto flex-1 font-mono text-xs bg-slate-950 text-slate-300 space-y-2 leading-relaxed selection:bg-rose-900/60">
              <pre className="whitespace-pre-wrap font-mono text-[11px] leading-relaxed">
                {ocrInspectionData.rawText}
              </pre>
            </div>

            {/* Modal Footer */}
            <div className="p-3.5 border-t border-slate-800 bg-slate-950 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <span className="text-slate-500">Engine:</span>
                <span className="text-cyan-400 font-mono">pdf-parse (pdfjs-dist) + Multimodal OCR</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => copyToClipboard(ocrInspectionData.rawText)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedHash === ocrInspectionData.rawText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied Text</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Full OCR Text</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => setOcrInspectionData(null)}
                  className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

