import React, { useState } from 'react';
import {
  Clock,
  PhoneCall,
  IndianRupee,
  MapPin,
  Users,
  Car,
  Globe,
  FileText,
  Search,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { useInvestigationStore } from '../../store/useInvestigationStore.js';

export const TimelineView: React.FC = () => {
  const { timeline, entities, setSelectedEntityId, setActiveTab } = useInvestigationStore();
  const [eventTypeFilter, setEventTypeFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const filteredEvents = timeline.filter((event) => {
    if (eventTypeFilter !== 'ALL' && event.type !== eventTypeFilter) {
      return false;
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchesTitle = event.title.toLowerCase().includes(q);
      const matchesDesc = event.description.toLowerCase().includes(q);
      const matchesId = event.id.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc && !matchesId) return false;
    }
    return true;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="w-4 h-4 text-emerald-400" />;
      case 'TRANSFER':
        return <IndianRupee className="w-4 h-4 text-amber-400" />;
      case 'SIGHTING':
      case 'VEHICLE_DETECTION':
        return <Car className="w-4 h-4 text-cyan-400" />;
      case 'MEETING':
        return <Users className="w-4 h-4 text-purple-400" />;
      case 'IP_SESSION':
        return <Globe className="w-4 h-4 text-indigo-400" />;
      case 'FIR_FILED':
        return <FileText className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  const getEntityName = (id?: string) => {
    if (!id) return null;
    const e = entities.find((ent) => ent.id === id);
    return e ? `${e.name} (${e.id})` : id;
  };

  return (
    <div id="timeline-view" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-semibold">
              CHRONOLOGY
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {filteredEvents.length} Recorded Incidents
            </span>
          </div>
          <h1 className="text-xl font-bold font-display text-slate-100">
            Chronological Investigation Timeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Temporal sequencing of criminal syndicate operations across call intercepts, financial wires, and field sightings
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filter events..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-600"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            <select
              value={eventTypeFilter}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL" className="bg-slate-900">All Event Types</option>
              <option value="CALL" className="bg-slate-900">Phone Calls</option>
              <option value="TRANSFER" className="bg-slate-900">Bank Transfers</option>
              <option value="SIGHTING" className="bg-slate-900">Tower Sightings</option>
              <option value="VEHICLE_DETECTION" className="bg-slate-900">Vehicle ANPR</option>
              <option value="MEETING" className="bg-slate-900">Meetings</option>
              <option value="IP_SESSION" className="bg-slate-900">IP Sessions</option>
              <option value="FIR_FILED" className="bg-slate-900">FIR Filings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Timeline List */}
      <div className="relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800 space-y-4">
        {filteredEvents.map((event) => (
          <div
            key={event.id}
            className="relative pl-10 group"
          >
            {/* Timeline Dot */}
            <div className="absolute left-2.5 top-3 -translate-x-1/2 w-4 h-4 rounded-full bg-slate-900 border-2 border-cyan-500 flex items-center justify-center ring-4 ring-slate-950">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            </div>

            {/* Event Card */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800/90 hover:border-slate-700 transition-colors shadow-sm space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-slate-950 border border-slate-800">
                    {getEventIcon(event.type)}
                  </div>
                  <h3 className="text-sm font-bold text-slate-100">{event.title}</h3>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                    {event.type}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-cyan-400">
                  {new Date(event.timestamp).toLocaleString()}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">{event.description}</p>

              {/* Connected Entities & Metadata */}
              <div className="pt-2 border-t border-slate-800/70 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400">
                <div className="flex flex-wrap items-center gap-3">
                  {event.sourceEntityId && (
                    <button
                      onClick={() => {
                        setSelectedEntityId(event.sourceEntityId!);
                        setActiveTab('network');
                      }}
                      className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-slate-400">Source:</span>
                      <span className="text-slate-200 font-semibold underline decoration-slate-700">
                        {getEntityName(event.sourceEntityId)}
                      </span>
                    </button>
                  )}

                  {event.targetEntityId && (
                    <button
                      onClick={() => {
                        setSelectedEntityId(event.targetEntityId!);
                        setActiveTab('network');
                      }}
                      className="hover:text-cyan-300 flex items-center gap-1 cursor-pointer"
                    >
                      <span className="text-slate-400">Target:</span>
                      <span className="text-slate-200 font-semibold underline decoration-slate-700">
                        {getEntityName(event.targetEntityId)}
                      </span>
                    </button>
                  )}

                  {event.locationId && (
                    <span className="flex items-center gap-1 text-orange-400">
                      <MapPin className="w-3 h-3" />
                      <span>{getEntityName(event.locationId)}</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400">Evidence: {event.evidenceId}</span>
                  <button
                    onClick={() => {
                      if (event.sourceEntityId) setSelectedEntityId(event.sourceEntityId);
                      setActiveTab('network');
                    }}
                    className="p-1 rounded hover:bg-slate-800 text-cyan-400 transition-colors"
                    title="View node on network canvas"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
