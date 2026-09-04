import React from 'react';
import {
  Settings,
  ShieldCheck,
  Cpu,
  KeyRound,
  Download,
  Database,
  Radio,
  Sliders,
  CheckCircle2,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';

export const SettingsView: React.FC = () => {
  const { cases, entities, evidence, timeline, activeCaseId } = useInvestigationStore();

  const handleExportJSON = () => {
    const exportBundle = {
      timestamp: new Date().toISOString(),
      activeCaseId,
      cases,
      entities,
      evidence,
      timeline,
      system: 'CrimeNet Analyst OS v2.4 (FIPS 180-4 Compliant)',
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CrimeNet_Investigation_Dossier_${activeCaseId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="settings-view" className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
            SYSTEM ARCHITECTURE
          </span>
          <span className="text-xs text-slate-400 font-mono">
            SECURITY & FORENSIC PROTOCOLS
          </span>
        </div>
        <h1 className="text-xl font-bold font-display text-slate-100">
          System Settings & Cryptographic Specifications
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Review operational parameters, AI integration layer, evidence vault configurations, and intelligence export manifests
        </p>
      </div>

      <div className="space-y-4">
        {/* Security & Cryptography Protocol */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-200">
              Chain-of-Custody Cryptographic Vault (FIPS 180-4)
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            All ingested exhibits (CDR logs, banking spreadsheets, motor vehicle records) are hashed via SHA-256 immediately upon arrival.
            The genesis hash is committed into an immutable audit registry. Live re-verification checks byte-level consistency to ensure court admissibility.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Digest Standard</span>
              <div className="font-semibold text-slate-200 mt-0.5">SHA-256 (256-bit)</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Verification Status</span>
              <div className="font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Active Continuous Audit</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Tamper Detection</span>
              <div className="font-semibold text-cyan-400 mt-0.5">Bit-Level Divergence Alert</div>
            </div>
          </div>
        </div>

        {/* AI Engine & Gemini Model */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h2 className="text-sm font-bold text-slate-200">
              AI Intelligence Layer & Gemini 3.8 Flash
            </h2>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            The criminal intelligence assistant operates with server-side API proxying to guarantee zero client exposure of credentials.
            Queries are analyzed by a deterministic rule parser and augmented by Gemini 3.8 Flash using only synthetic, de-identified demo data.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Model Endpoint</span>
              <div className="font-semibold text-slate-200">@google/genai (gemini-3.8-flash)</div>
              <div className="text-[10px] text-slate-400">Low-latency tactical intelligence summarization</div>
            </div>
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Key Confidentiality</span>
              <div className="font-semibold text-emerald-400">Server-Side Secret Isolation</div>
              <div className="text-[10px] text-slate-400">Never exposed to client DOM or DevTools</div>
            </div>
          </div>
        </div>

        {/* Export Full Dossier */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-slate-200">Export Complete Investigation Dossier</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Download all POLE entities, relationships, cryptographic hashes, and chronology exhibits as a verified JSON bundle
            </p>
          </div>
          <button
            onClick={handleExportJSON}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold flex items-center gap-2 shadow-md transition-colors cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Export Case JSON</span>
          </button>
        </div>

        {/* Demo Intelligence Management */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold text-slate-200">Pre-Loaded Demo Intelligence Packs</h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              3 syndicates pre-loaded (Operation Shadow Ledger, Operation Black Corridor, Operation Golden Crest) with 69 POLE entities, 10 verified evidence exhibits, and full graph topologies.
            </p>
          </div>
          <button
            onClick={async () => {
              const { restoreDemoIntelligence } = useInvestigationStore.getState();
              await restoreDemoIntelligence();
            }}
            className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-2 shadow-md transition-colors cursor-pointer shrink-0"
          >
            <Database className="w-4 h-4" />
            <span>Re-seed Demo Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
