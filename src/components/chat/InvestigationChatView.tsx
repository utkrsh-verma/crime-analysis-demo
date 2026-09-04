import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquareCode,
  Send,
  Trash2,
  Sparkles,
  Bot,
  User,
  ExternalLink,
  ShieldCheck,
  Terminal,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';

export const InvestigationChatView: React.FC = () => {
  const {
    chatMessages,
    isChatLoading,
    sendChatMessage,
    clearChat,
    setActiveTab,
    setHighlights,
  } = useInvestigationStore();

  const [inputQuery, setInputQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPrompts = [
    'Show high-risk persons.',
    'Find connections of P001.',
    'Find the shortest path between P001 and P005.',
    'Show transactions above 1 lakh.',
    'Show events involving Utkarsh Verma.',
    'Show all entities connected to Tower 45.',
  ];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim() || isChatLoading) return;
    sendChatMessage(inputQuery);
    setInputQuery('');
  };

  const handlePromptClick = (prompt: string) => {
    sendChatMessage(prompt);
  };

  return (
    <div id="investigation-chat-view" className="p-6 max-w-5xl mx-auto h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800 font-semibold flex items-center gap-1">
              <Terminal className="w-3 h-3" />
              <span>COMMAND COGNITION</span>
            </span>
            <span className="text-xs text-slate-400 font-mono">
              DATASET QUERY INTERFACE
            </span>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-100">
            Criminal Intelligence Assistant
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Query POLE entities, suspicious money trails, cellular burst patterns, and shortest path connections
          </p>
        </div>

        <button
          onClick={clearChat}
          title="Reset Chat Session"
          className="p-2 rounded-lg bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Suggested Prompt Directives */}
      <div className="py-3 border-b border-slate-800 shrink-0">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2">
          Investigation Query Shortcuts
        </div>
        <div className="flex flex-wrap gap-2">
          {quickPrompts.map((prompt, i) => (
            <button
              key={i}
              onClick={() => handlePromptClick(prompt)}
              disabled={isChatLoading}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-700 text-xs text-slate-300 hover:text-cyan-300 font-mono transition-colors disabled:opacity-50 cursor-pointer text-left"
            >
              "{prompt}"
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Body */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4">
        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex items-start gap-3 ${
              msg.sender === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.sender === 'assistant' && (
              <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl rounded-2xl p-4 shadow-sm space-y-2 text-xs leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-slate-950 font-medium ml-12 rounded-tr-sm'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 mr-12 rounded-tl-sm'
              }`}
            >
              {/* Message Header for Assistant */}
              {msg.sender === 'assistant' && (
                <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-slate-800">
                  <span className="font-semibold text-slate-300">CrimeNet Assistant</span>
                  <div className="flex items-center gap-1.5">
                    {msg.source === 'GEMINI_AI' ? (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-950 text-purple-300 border border-purple-800 font-mono font-bold flex items-center gap-1">
                        <Sparkles className="w-2.5 h-2.5" />
                        GEMINI AI
                      </span>
                    ) : (
                      <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-950 text-cyan-400 border border-cyan-800 font-mono font-bold">
                        CONTROLLED PARSER
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )}

              {/* Message Content */}
              <div className="whitespace-pre-line font-mono">{msg.text}</div>

              {/* Highlighted Nodes Action Button */}
              {msg.highlightNodeIds && msg.highlightNodeIds.length > 0 && (
                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-400">
                    {msg.highlightNodeIds.length} Graph nodes flagged
                  </span>
                  <button
                    onClick={() => {
                      setHighlights(msg.highlightNodeIds!);
                      setActiveTab('network');
                    }}
                    className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>View on Graph Canvas</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {msg.sender === 'user' && (
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0 mt-0.5">
                <User className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}

        {isChatLoading && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/80 flex items-center justify-center text-cyan-400 shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 font-mono flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 animate-spin text-cyan-400" />
              <span>Analyzing criminal database entities & running graph traversals...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Form Bar */}
      <form onSubmit={handleSubmit} className="pt-3 border-t border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <input
            id="chat-input"
            type="text"
            placeholder="Ask questions (e.g. 'Show high-risk persons', 'Find shortest path between P001 and P005')..."
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            disabled={isChatLoading}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-600 font-mono"
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isChatLoading}
            className="px-5 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-950 font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-900/20 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Transmit</span>
          </button>
        </div>
      </form>
    </div>
  );
};
