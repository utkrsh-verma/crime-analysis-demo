import React, { useEffect } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  RefreshCw,
  Flame,
  CheckCircle2,
  Copy,
  Check,
  RotateCcw,
  FileSpreadsheet,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';

export const EvidenceVerificationView: React.FC = () => {
  const {
    evidence,
    selectedEvidenceForVerify,
    setSelectedEvidenceForVerify,
    verificationResult,
    verifySelectedEvidence,
    simulateTamper,
    restoreEvidence,
    isLoading,
  } = useInvestigationStore();

  const [copiedHash, setCopiedHash] = React.useState<string | null>(null);

  const activeEvidence =
    evidence.find((e) => e.id === selectedEvidenceForVerify) || evidence[0];

  useEffect(() => {
    if (activeEvidence) {
      verifySelectedEvidence(activeEvidence.id);
    }
  }, [selectedEvidenceForVerify]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(text);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div id="evidence-verification-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-semibold">
            CHAIN OF CUSTODY
          </span>
          <span className="text-xs text-slate-400 font-mono">
            FIPS 180-4 CRYPTOGRAPHIC STANDARD
          </span>
        </div>
        <h1 className="text-xl font-bold font-display text-slate-100">
          Evidence Integrity Verification & Tamper Detection
        </h1>
        <p className="text-xs text-slate-400 max-w-2xl mt-1 leading-relaxed">
          Forensic verification compares the genesis SHA-256 digest recorded upon evidence intake against a live re-computation of the binary payload in the vault.
          Any unauthorized modification, bit-flip, or data tampering triggers a hash mismatch alert.
        </p>
      </div>

      {/* Target Evidence Selector Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-cyan-400">
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              Select Evidence Record to Audit
            </label>
            <select
              id="evidence-verify-select"
              value={selectedEvidenceForVerify || activeEvidence?.id}
              onChange={(e) => setSelectedEvidenceForVerify(e.target.value)}
              className="bg-transparent text-sm font-semibold text-slate-200 focus:outline-none cursor-pointer mt-0.5"
            >
              {evidence.map((ev) => (
                <option key={ev.id} value={ev.id} className="bg-slate-900 text-slate-200">
                  [{ev.id}] {ev.fileName} ({ev.fileType})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Audit Actions */}
        <div className="flex items-center gap-2">
          <button
            id="btn-run-verify"
            onClick={() => activeEvidence && verifySelectedEvidence(activeEvidence.id)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-verify Checksum</span>
          </button>

          <button
            id="btn-simulate-tamper"
            onClick={() => activeEvidence && simulateTamper(activeEvidence.id)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 border border-rose-800 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Flame className="w-3.5 h-3.5 text-rose-400" />
            <span>Simulate Tampering</span>
          </button>

          <button
            id="btn-restore-evidence"
            onClick={() => activeEvidence && restoreEvidence(activeEvidence.id)}
            disabled={isLoading}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Restore Pristine</span>
          </button>
        </div>
      </div>

      {/* Verification Results Panel */}
      {verificationResult && (
        <div
          className={`p-6 rounded-2xl border ${
            verificationResult.verified
              ? 'bg-emerald-950/20 border-emerald-800/80'
              : 'bg-rose-950/30 border-rose-700'
          } shadow-xl relative overflow-hidden`}
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-5 border-b border-slate-800/60">
            <div className="flex items-center gap-3">
              <div
                className={`p-3 rounded-xl border ${
                  verificationResult.verified
                    ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border-rose-800'
                }`}
              >
                {verificationResult.verified ? (
                  <ShieldCheck className="w-8 h-8" />
                ) : (
                  <AlertTriangle className="w-8 h-8" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs px-2.5 py-0.5 rounded font-mono font-bold ${
                      verificationResult.verified
                        ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-700'
                        : 'bg-rose-900/60 text-rose-300 border border-rose-700'
                    }`}
                  >
                    STATUS: {verificationResult.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Audited at {new Date(verificationResult.verifiedAt).toLocaleTimeString()}
                  </span>
                </div>
                <h2 className="text-lg font-bold text-slate-100 mt-1">
                  {verificationResult.verified
                    ? 'Cryptographic Integrity Confirmed'
                    : 'CRITICAL ALERT: HASH MISMATCH DETECTED'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">{verificationResult.message}</p>
              </div>
            </div>

            <div className="text-right font-mono text-xs text-slate-400">
              <div>File: {verificationResult.fileName}</div>
              <div>Size: {verificationResult.fileSizeBytes} bytes</div>
            </div>
          </div>

          {/* SHA-256 Hash Comparison Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
            {/* Genesis Hash */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Genesis Intake SHA-256 (Chain of Custody)</span>
                <span className="text-[10px] text-emerald-400 font-mono font-bold">RECORDED</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 font-mono text-xs text-slate-300 break-all select-all flex items-center justify-between gap-2 border border-slate-800">
                <span>{verificationResult.originalHash}</span>
                <button
                  onClick={() => copyToClipboard(verificationResult.originalHash)}
                  className="p-1 hover:text-white text-slate-500 cursor-pointer"
                >
                  {copiedHash === verificationResult.originalHash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Recorded immediately upon initial intake by Special Cell Forensics
              </p>
            </div>

            {/* Current Recalculated Hash */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span>Vault Recalculated SHA-256 (Real-Time Buffer)</span>
                <span
                  className={`text-[10px] font-mono font-bold ${
                    verificationResult.verified ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {verificationResult.verified ? 'MATCHES GENESIS' : 'HASH DIVERGED'}
                </span>
              </div>
              <div
                className={`p-2.5 rounded-lg font-mono text-xs break-all select-all flex items-center justify-between gap-2 border ${
                  verificationResult.verified
                    ? 'bg-slate-900 border-slate-800 text-slate-300'
                    : 'bg-rose-950/40 border-rose-800 text-rose-300 font-bold'
                }`}
              >
                <span>{verificationResult.currentHash}</span>
                <button
                  onClick={() => copyToClipboard(verificationResult.currentHash)}
                  className="p-1 hover:text-white text-slate-500 cursor-pointer"
                >
                  {copiedHash === verificationResult.currentHash ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
              <p className="text-[10px] text-slate-400">
                Computed via Node.js crypto engine (crypto.createHash('sha256'))
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Forensic Chain-of-Custody Certification Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
        <div className="flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-bold text-slate-200">
            Chain of Custody Standard Protocol (ISO/IEC 27037)
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed">
          Digital evidence ingested into CrimeNet Analyst undergoes instantaneous cryptographic sealing.
          The 256-bit hash fingerprint serves as definitive mathematical proof in court proceedings that evidence records
          (including call timestamps, call durations, account balances, and license plates) remain pristine and untouched from initial seizure to court presentation.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Algorithm</div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5">SHA-256 (FIPS 180-4)</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Vault Storage</div>
            <div className="text-xs font-semibold text-slate-200 mt-0.5">Immutable In-Memory Buffer</div>
          </div>
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase font-bold text-slate-400 font-mono">Verification Rate</div>
            <div className="text-xs font-semibold text-emerald-400 mt-0.5">100% Cryptographic Match</div>
          </div>
        </div>
      </div>
    </div>
  );
};
