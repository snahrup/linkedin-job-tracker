import React from 'react';
import { Search, Filter, Calendar, MapPin, Briefcase, ChevronDown, ChevronUp } from 'lucide-react';
import { useStore } from '../store';
import { AppStatus, WorkLocation, EmploymentType } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../utils';

export function Filters() {
  const { filters, setFilters, filtersCollapsed, setFiltersCollapsed } = useStore();

  const toggleStatus = (status: AppStatus) => {
    const newStatuses = filters.statuses.includes(status)
      ? filters.statuses.filter(s => s !== status)
      : [...filters.statuses, status];
    setFilters({ statuses: newStatuses });
  };

  const toggleWorkLocation = (location: WorkLocation) => {
    const newLocations = filters.workLocations.includes(location)
      ? filters.workLocations.filter(l => l !== location)
      : [...filters.workLocations, location];
    setFilters({ workLocations: newLocations });
  };

  const toggleEmploymentType = (type: EmploymentType) => {
    const newTypes = filters.employmentTypes.includes(type)
      ? filters.employmentTypes.filter(t => t !== type)
      : [...filters.employmentTypes, type];
    setFilters({ employmentTypes: newTypes });
  };

  // Calculate filter summary for collapsed state
  const activeFiltersCount = 
    (filters.query ? 1 : 0) +
    (filters.dateFrom || filters.dateTo ? 1 : 0) +
    (filters.statuses.length < 5 ? 1 : 0) +
    (filters.workLocations.length < 3 ? 1 : 0) +
    (filters.employmentTypes.length < 4 ? 1 : 0);

  if (filtersCollapsed) {
    return (
      <div className="glass-card p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Search Bar - Always show when collapsed */}
            <div className="flex-1 min-w-[200px] flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="flex-1 bg-transparent outline-none placeholder:text-slate-500 text-white text-sm"
                value={filters.query}
                onChange={(e) => setFilters({ query: e.target.value })}
              />
            </div>
            
            {/* Filter Summary */}
            {activeFiltersCount > 0 && (
              <div className="text-xs text-slate-400 bg-slate-700/30 px-2 py-1 rounded-md">
                {activeFiltersCount} filter{activeFiltersCount !== 1 ? 's' : ''} active
              </div>
            )}
          </div>
          
          {/* Expand Button */}
          <button
            onClick={() => setFiltersCollapsed(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white transition-colors"
          >
            <Filter className="h-4 w-4" />
            <span className="hidden sm:inline">Filters</span>
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-4 space-y-4">
      {/* Header with Collapse Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Filter className="h-4 w-4" />
          <span>Filters</span>
        </div>
        <button
          onClick={() => setFiltersCollapsed(true)}
          className="flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-slate-300 transition-colors"
        >
          Collapse <ChevronUp className="h-3 w-3" />
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[300px] flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-700/50 px-3 py-2">
          <Search className="h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, position, location..."
            className="flex-1 bg-transparent outline-none placeholder:text-slate-500 text-white text-sm"
            value={filters.query}
            onChange={(e) => setFilters({ query: e.target.value })}
          />
        </div>
        
        {/* Date Range */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-slate-400" />
          <input
            type="date"
            className="bg-slate-700/50 rounded-md px-2 py-1 border border-slate-600 text-white text-sm"
            value={filters.dateFrom || ""}
            onChange={(e) => setFilters({ dateFrom: e.target.value || undefined })}
          />
          <span className="text-slate-400">to</span>
          <input
            type="date"
            className="bg-slate-700/50 rounded-md px-2 py-1 border border-slate-600 text-white text-sm"
            value={filters.dateTo || ""}
            onChange={(e) => setFilters({ dateTo: e.target.value || undefined })}
          />
        </div>
      </div>
      
      {/* Status Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Filter className="h-4 w-4" />
          <span>Status</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(STATUS_LABELS) as AppStatus[]).map(status => (
            <button
              key={status}
              onClick={() => toggleStatus(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filters.statuses.includes(status)
                  ? STATUS_COLORS[status]
                  : 'border-slate-600 text-slate-400 bg-slate-700/30 hover:bg-slate-700/50'
              }`}
            >
              {STATUS_LABELS[status]}
            </button>
          ))}
        </div>
      </div>
      
      {/* Work Location Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <MapPin className="h-4 w-4" />
          <span>Work Location</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['remote', 'hybrid', 'onsite'] as WorkLocation[]).map(location => (
            <button
              key={location}
              onClick={() => toggleWorkLocation(location)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all capitalize ${
                filters.workLocations.includes(location)
                  ? 'border-blue-500/50 bg-blue-500/30 text-blue-300'
                  : 'border-slate-600 text-slate-400 bg-slate-700/30 hover:bg-slate-700/50'
              }`}
            >
              {location}
            </button>
          ))}
        </div>
      </div>
      
      {/* Employment Type Filters */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <Briefcase className="h-4 w-4" />
          <span>Employment Type</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['full_time', 'part_time', 'contract', 'temporary'] as EmploymentType[]).map(type => (
            <button
              key={type}
              onClick={() => toggleEmploymentType(type)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                filters.employmentTypes.includes(type)
                  ? 'border-green-500/50 bg-green-500/30 text-green-300'
                  : 'border-slate-600 text-slate-400 bg-slate-700/30 hover:bg-slate-700/50'
              }`}
            >
              {type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
