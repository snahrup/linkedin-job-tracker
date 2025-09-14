import React from 'react';
import { ApplicationCard } from './ApplicationCard';
import { ApplicationRec } from '../types';
import { motion } from 'framer-motion';

interface ApplicationGridProps {
  applications: ApplicationRec[];
}

export function ApplicationGrid({ applications }: ApplicationGridProps) {
  if (applications.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <p className="text-slate-300">No applications match your filters.</p>
        <p className="text-sm text-slate-400 mt-2">
          Try adjusting your filters or connect Gmail to sync your applications.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      {applications.map((app, index) => (
        <motion.div
          key={app.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
        >
          <ApplicationCard app={app} />
        </motion.div>
      ))}
    </motion.div>
  );
}
