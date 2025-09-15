import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, MapPin, Clock, ExternalLink, DollarSign, 
  Briefcase, Edit2, Save, X, FileText, Target, TrendingUp 
} from 'lucide-react';
import { ApplicationRec } from '../types';
import { STATUS_COLORS, STATUS_LABELS, formatDate, formatRelativeDate } from '../utils';
import { useStore } from '../store';
import { getScoreColor, formatScore } from '../aiScoring';

interface ApplicationCardProps {
  app: ApplicationRec;
  viewMode?: 'compact' | 'normal' | 'large' | 'list';
  onShowDetails?: (app: ApplicationRec) => void;
}

export function ApplicationCard({ app, viewMode = 'normal', onShowDetails }: ApplicationCardProps) {
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

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on interactive elements
    if (
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('a') ||
      (e.target as HTMLElement).closest('textarea') ||
      isEditing
    ) {
      return;
    }
    
    if (onShowDetails && app.matchScore) {
      onShowDetails(app);
    }
  };

  // List view - horizontal layout
  if (viewMode === 'list') {
    return (
      <motion.div
        whileHover={{ x: 4 }}
        className={`glass-card p-4 transition-all duration-300 hover:shadow-xl ${
          onShowDetails && app.matchScore ? 'cursor-pointer' : ''
        }`}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-lg bg-slate-700 border border-slate-600 grid place-items-center flex-shrink-0">
            {app.companyLogo || <Building2 className="h-5 w-5 text-slate-400" />}
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-center">
            <div className="md:col-span-1">
              <h3 className="font-semibold text-white">{app.company}</h3>
            </div>
            <div className="md:col-span-1">
              <p className="text-sm text-cyan-400">{app.position}</p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <MapPin className="h-3 w-3 text-slate-400" />
              <span>{app.location}</span>
              <Clock className="h-3 w-3 text-slate-400 ml-2" />
              <span>{formatRelativeDate(app.applicationDate)}</span>
            </div>
            <div className="flex items-center gap-2 justify-end">
              {app.matchScore && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(app.matchScore.overall)}`}>
                  {formatScore(app.matchScore.overall)}
                </span>
              )}
              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status]}`}>
                {STATUS_LABELS[app.status]}
              </span>
              {app.linkedinUrl && (
                <a
                  href={app.linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 hover:bg-slate-700 rounded"
                >
                  <ExternalLink className="h-3.5 w-3.5 text-blue-400" />
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Compact view - minimal info
  if (viewMode === 'compact') {
    return (
      <motion.div
        whileHover={{ y: -2 }}
        className={`glass-card p-3 transition-all duration-300 hover:shadow-xl h-full ${
          onShowDetails && app.matchScore ? 'cursor-pointer' : ''
        }`}
        onClick={handleCardClick}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-white text-sm line-clamp-1">{app.company}</h3>
              <p className="text-xs text-cyan-400 line-clamp-2 mt-1">{app.position}</p>
            </div>
            <span className={`px-1.5 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[app.status]}`}>
              {STATUS_LABELS[app.status].slice(0, 3)}
            </span>
          </div>
          <div className="text-xs text-slate-400">
            {formatRelativeDate(app.applicationDate)}
          </div>
        </div>
      </motion.div>
    );
  }

  // Large view - all details
  const cardPadding = viewMode === 'large' ? 'p-8' : 'p-6';
  const iconSize = viewMode === 'large' ? 'h-14 w-14' : 'h-12 w-12';
  const titleSize = viewMode === 'large' ? 'text-lg' : 'text-base';

  // Normal and Large views - card layout
  return (
    <motion.div
      layout
      whileHover={{ y: -4 }}
      className={`glass-card ${cardPadding} transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl h-full flex flex-col ${
        onShowDetails && app.matchScore ? 'cursor-pointer' : ''
      }`}
      onClick={handleCardClick}
    >
      <div className="space-y-4 flex-1">
        {/* Header */}
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`${iconSize} rounded-xl bg-slate-700 border border-slate-600 grid place-items-center flex-shrink-0`}>
                {app.companyLogo || <Building2 className={viewMode === 'large' ? 'h-7 w-7' : 'h-6 w-6'} />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className={`font-semibold text-white break-words ${titleSize}`}>{app.company}</h3>
                <p className={`${viewMode === 'large' ? 'text-base' : 'text-sm'} text-cyan-400 font-medium break-words mt-1`}>{app.position}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center gap-2">
            {app.matchScore && (
              <div className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5 text-slate-400" />
                <span className={`px-2 py-1 rounded-full text-xs font-bold border ${getScoreColor(app.matchScore.overall)}`}>
                  {formatScore(app.matchScore.overall)}
                </span>
              </div>
            )}
            <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[app.status]}`}>
              {STATUS_LABELS[app.status]}
            </span>
          </div>
        </div>
        
        {/* Details */}
        <div className="space-y-2 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <MapPin className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-white">{app.location}</span>
            {app.workLocation && (
              <span className="px-2 py-0.5 rounded bg-blue-500/30 text-blue-300 capitalize">
                {app.workLocation}
              </span>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-slate-400" />
            <span className="text-white">Applied {formatRelativeDate(app.applicationDate)}</span>
          </div>
          
          {app.salaryRange && (
            <div className="flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-white">{app.salaryRange}</span>
            </div>
          )}
          
          {app.employmentType && (
            <div className="flex items-center gap-2">
              <Briefcase className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-white capitalize">{app.employmentType.replace('_', ' ')}</span>
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
          ) : (
            <div>
              {app.notes ? (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300">{app.notes}</p>
                  <button 
                    onClick={() => setIsEditing(true)} 
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    <Edit2 className="h-3 w-3" /> Edit notes
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => setIsEditing(true)} 
                  className="text-xs text-slate-400 hover:text-slate-300 flex items-center gap-1"
                >
                  <FileText className="h-3 w-3" /> Add notes
                </button>
              )}
            </div>
          )}
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          {app.linkedinUrl && (
            <a
              href={app.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
            >
              <ExternalLink className="h-3 w-3" />
              View on LinkedIn
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}
