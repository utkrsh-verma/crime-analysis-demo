import React, { useState } from 'react';
import {
  FolderGit2,
  Plus,
  ArrowRight,
  ShieldCheck,
  FileSpreadsheet,
  Fingerprint,
  Calendar,
  User,
  Radio,
  X,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';
import { InvestigationApi } from '../../api/client.js';

export const CasesView: React.FC = () => {
  const { cases, activeCaseId, setActiveCaseId, setActiveTab, refreshAllData } =
    useInvestigationStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('HIGH');
  const [newLead, setNewLead] = useState('Insp. Vikram Rathore (Cyber Cell)');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateCase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setIsSubmitting(true);
    try {
      const created = await InvestigationApi.createCase({
        title: newTitle,
        description: newDesc,
        priority: newPriority,
        leadInvestigator: newLead,
      });
      await refreshAllData();
      setActiveCaseId(created.id);
      setIsCreateOpen(false);
      setNewTitle('');
      setNewDesc('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="cases-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
              CASE DOSSIERS
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {cases.length} Total Registered Files
            </span>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-100">
            Criminal Investigation Dossiers
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Organized intelligence cases housing isolated POLE entities, evidentiary exhibits, and cryptographic audit trails
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-semibold flex items-center gap-2 shadow-md shadow-cyan-900/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Case Dossier</span>
        </button>
      </div>

      {/* Case Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cases.map((c) => {
          const isActive = activeCaseId === c.id;
          return (
            <div
              key={c.id}
              className={`rounded-xl p-5 border transition-all flex flex-col justify-between shadow-sm relative overflow-hidden ${
                isActive
                  ? 'bg-slate-900 border-cyan-700/80 shadow-cyan-950/40 ring-1 ring-cyan-600/30'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {isActive && (
                <div className="absolute top-0 right-0 bg-cyan-600 text-slate-950 text-[9px] uppercase font-bold px-2.5 py-0.5 rounded-bl-lg font-mono">
                  ACTIVE FOCUS
                </div>
              )}

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-mono text-xs font-bold text-cyan-400">
                    {c.id}
                  </span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                      c.priority === 'CRITICAL'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {c.priority} PRIORITY
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 font-mono">
                    STATUS: {c.status}
                  </span>
                </div>

                <h2 className="text-base font-bold text-slate-100">{c.title}</h2>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  {c.description}
                </p>

                {/* Case Metadata */}
                <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs font-mono text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                    <span className="truncate">{c.leadInvestigator}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{new Date(c.createdDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Fingerprint className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>{c.entityCount || 0} Entities</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>{c.evidenceCount || 0} Exhibits</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {isActive ? (
                  <span className="text-xs text-cyan-400 font-mono flex items-center gap-1.5">
                    <Radio className="w-3 h-3 animate-pulse" />
                    <span>Active in Workspace</span>
                  </span>
                ) : (
                  <button
                    onClick={() => setActiveCaseId(c.id)}
                    className="text-xs text-slate-300 hover:text-cyan-300 font-medium cursor-pointer"
                  >
                    Select as Active Case
                  </button>
                )}

                <button
                  onClick={() => {
                    setActiveCaseId(c.id);
                    setActiveTab('network');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <span>Explore Network</span>
                  <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* New Case Creation Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
              <div className="flex items-center gap-2">
                <FolderGit2 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-100">Open New Investigation Case</h3>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Investigation Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Operation DarkRoute: Cross-Border Cyber Hawala"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">
                  Case Brief & Syndicate Scope
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide scope, jurisdiction, suspected operational methods, and involved factions..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-300 mb-1">Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-600"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                  </select>
                </div>

                <div>
                  <label className="block font-medium text-slate-300 mb-1">
                    Lead Special Agent
                  </label>
                  <input
                    type="text"
                    value={newLead}
                    onChange={(e) => setNewLead(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-cyan-600"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !newTitle.trim()}
                  className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-semibold shadow-md transition-colors cursor-pointer"
                >
                  {isSubmitting ? 'Opening Dossier...' : 'Create Dossier'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
