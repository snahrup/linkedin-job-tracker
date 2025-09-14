import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, MapPin, Clock, ExternalLink, DollarSign, 
  Briefcase, Edit2, Save, X, FileText 
} from 'lucide-react';
import { ApplicationRec } from '../types';
import { STATUS_COLORS, STATUS_LABELS, formatDate, formatRelativeDate } from '../utils';
import { useStore } from '../store';

interface ApplicationCardProps {
  app: ApplicationRec;
}

export function ApplicationCard({ app }: ApplicationCardProps) {
  const { updateApp } = useStore();
  const [isEditing, setIsEditing] = useState(false);
  const [notes, setNotes] = useState(app.notes || '');

  const handleSaveNotes = () => {
    updateApp(app.id, { notes });
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setNotes(app.notes || '');
    setIsEditing(false);
  };

  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className="glass-card p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl"
    >
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1">
            <div className="h-12 w-12 rounded-xl bg-white/10 border border-white/20 grid place-items-center">
              {app.companyLogo || <Building2 className="h-6 w-6" />}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-white truncate">{app.company}</h3>
              <p className="text-sm text-blue-400 truncate">{app.position}</p>
            </div>
          </div>
          <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status]}`}>
            {STATUS_LABELS[app.status]}
          </span>
        </div>
        
        {/* Details */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5" />
            <span>{app.location}</span>
            {app.workLocation && (
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 capitalize">
                {app.workLocation}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5" />
            <span>Applied {formatRelativeDate(app.applicationDate)}</span>
          </div>
          
          {app.salaryRange && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              <span>{app.salaryRange}</span>
            </div>
          )}
          
          {app.employmentType && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5" />
              <span className="capitalize">{app.employmentType.replace('_', ' ')}</span>
            </div>
          )}
        </div>
        
        {/* Timeline */}
        {app.statusHistory.length > 1 && (
          <div className="pt-2 border-t border-white/10">
            <div className="text-xs text-slate-400 space-y-1">
              {app.statusHistory.slice(-2).map((history, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>{STATUS_LABELS[history.status]} - {formatDate(history.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Notes Section */}
        <div className="pt-2 border-t border-white/10">
          {isEditing ? (
            <div className="space-y-2">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-2 bg-white/10 border border-white/20 rounded-lg text-sm text-white placeholder:text-slate-400 resize-none"
                placeholder="Add notes..."
                rows={3}
              />
              <div className="flex gap-2">
                <button onClick={handleSaveNotes} className="btn-primary text-xs px-2 py-1">
                  <Save className="h-3 w-3" /> Save
                </button>
                <button onClick={handleCancelEdit} className="btn-secondary text-xs px-2 py-1">
                  <X className="h-3 w-3" /> Cancel
                </button>
              </div>
            </div>
