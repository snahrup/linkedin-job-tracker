import React, { useState } from 'react';
import { ApplicationCard } from './ApplicationCard';
import { DetailedAnalysisModal } from './DetailedAnalysisModal';
import { ApplicationRec } from '../types';
import { motion } from 'framer-motion';
import { Grid3x3, Grid2x2, List, LayoutGrid } from 'lucide-react';

interface ApplicationGridProps {
  applications: ApplicationRec[];
}

type ViewMode = 'compact' | 'normal' | 'large' | 'list';

export function ApplicationGrid({ applications }: ApplicationGridProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('normal');
  const [selectedApp, setSelectedApp] = useState<ApplicationRec | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleShowDetails = (app: ApplicationRec) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedApp(null);
  };

  if (applications.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-white font-medium">No applications match your filters.</p>
        <p className="text-sm text-slate-400 mt-2">
          Try adjusting your filters or connect Gmail to sync your applications.
        </p>
      </div>
    );
  }

  const gridClasses = {
    compact: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3',
    normal: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
    large: 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5',
    list: 'flex flex-col gap-3'
  };

  return (
    <div className="space-y-4">
      {/* View Mode Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Applications ({applications.length})</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-slate-400 mr-2">View:</span>
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'list' 
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                : 'bg-slate-700/30 text-slate-400 border border-slate-600 hover:bg-slate-700/50'
            }`}
            title="List View"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('compact')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'compact' 
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                : 'bg-slate-700/30 text-slate-400 border border-slate-600 hover:bg-slate-700/50'
            }`}
            title="Compact View"
          >
            <Grid3x3 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('normal')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'normal' 
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                : 'bg-slate-700/30 text-slate-400 border border-slate-600 hover:bg-slate-700/50'
            }`}
            title="Normal View"
          >
            <Grid2x2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setViewMode('large')}
            className={`p-2 rounded-lg transition-colors ${
              viewMode === 'large' 
                ? 'bg-blue-500/30 text-blue-300 border border-blue-500/50' 
                : 'bg-slate-700/30 text-slate-400 border border-slate-600 hover:bg-slate-700/50'
            }`}
            title="Large View"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Applications Grid */}
      <motion.div 
        className={gridClasses[viewMode]}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        key={viewMode}
      >
        {applications.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05, duration: 0.3 }}
            className={viewMode === 'list' ? 'w-full' : ''}
          >
            <ApplicationCard app={app} viewMode={viewMode} onShowDetails={handleShowDetails} />
          </motion.div>
        ))}
      </motion.div>

      {/* Detailed Analysis Modal */}
      <DetailedAnalysisModal 
        app={selectedApp}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </div>
  );
}
