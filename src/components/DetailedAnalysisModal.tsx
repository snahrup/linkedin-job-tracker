import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Target, Brain, BarChart3, MapPin, DollarSign, 
  CheckCircle, Lightbulb, User, Building2
} from 'lucide-react';
import { ApplicationRec } from '../types';
import { getScoreColor } from '../aiScoring';

interface DetailedAnalysisModalProps {
  app: ApplicationRec | null;
  isOpen: boolean;
  onClose: () => void;
}

export function DetailedAnalysisModal({ app, isOpen, onClose }: DetailedAnalysisModalProps) {
  if (!app || !app.matchScore) return null;

  const { matchScore } = app;

  const getOverallScoreText = (score: number) => {
    if (score >= 85) return { text: 'Excellent Match', color: 'text-green-400' };
    if (score >= 70) return { text: 'Strong Match', color: 'text-cyan-400' };
    if (score >= 55) return { text: 'Good Match', color: 'text-yellow-400' };
    if (score >= 40) return { text: 'Moderate Match', color: 'text-orange-400' };
    return { text: 'Weak Match', color: 'text-red-400' };
  };

  const overallScore = getOverallScoreText(matchScore.overall);

  const scoreCategories = [
    {
      label: 'Skills Match',
      score: matchScore.skills,
      icon: Brain,
      color: 'text-purple-400',
      description: 'How well your technical skills align with job requirements'
    },
    {
      label: 'Experience Level',
      score: matchScore.experience,
      icon: User,
      color: 'text-blue-400',
      description: 'Your experience level vs. the position requirements'
    },
    {
      label: 'Location Fit',
      score: matchScore.location,
      icon: MapPin,
      color: 'text-green-400',
      description: 'Geographic compatibility and remote work preferences'
    },
    {
      label: 'Compensation',
      score: matchScore.salary,
      icon: DollarSign,
      color: 'text-yellow-400',
      description: 'Salary expectations vs. offered compensation'
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="p-6 border-b border-slate-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-slate-700 border border-slate-600 grid place-items-center">
                      {app.companyLogo || <Building2 className="h-6 w-6 text-slate-400" />}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{app.company}</h2>
                      <p className="text-lg text-cyan-400 font-medium">{app.position}</p>
                      <p className="text-sm text-slate-400 mt-1">{app.location}</p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-800 rounded-lg transition-colors"
                  >
                    <X className="h-6 w-6 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Overall Score */}
                  <div className="lg:col-span-1">
                    <div className="glass-card p-6 text-center">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <Target className="h-6 w-6 text-cyan-400" />
                        <h3 className="text-xl font-semibold text-white">Overall Match</h3>
                      </div>
                      
                      {/* Circular Progress */}
                      <div className="relative w-40 h-40 mx-auto mb-4">
                        <svg className="w-40 h-40 transform -rotate-90">
                          <circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            className="text-slate-700"
                          />
                          <motion.circle
                            cx="80"
                            cy="80"
                            r="70"
                            stroke="currentColor"
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${2 * Math.PI * 70}`}
                            strokeDashoffset={`${2 * Math.PI * 70 * (1 - matchScore.overall / 100)}`}
                            className={overallScore.color.replace('text-', 'text-')}
                            initial={{ strokeDashoffset: `${2 * Math.PI * 70}` }}
                            animate={{ strokeDashoffset: `${2 * Math.PI * 70 * (1 - matchScore.overall / 100)}` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <div className={`text-4xl font-bold ${overallScore.color}`}>
                            {matchScore.overall}%
                          </div>
                          <div className={`text-sm font-medium ${overallScore.color}`}>
                            {overallScore.text}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-sm text-slate-400">
                        Based on AI analysis of your profile vs. job requirements
                      </p>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="lg:col-span-2">
                    <div className="glass-card p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-xl font-semibold text-white">Score Breakdown</h3>
                      </div>
                      
                      <div className="space-y-4">
                        {scoreCategories.map((category, index) => {
                          const Icon = category.icon;
                          return (
                            <motion.div
                              key={category.label}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="space-y-2"
                            >
                              {/* Score Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Icon className={`h-4 w-4 ${category.color}`} />
                                  <span className="text-sm font-medium text-white">{category.label}</span>
                                </div>
                                <span className={`text-sm font-bold ${getScoreColor(category.score).split(' ')[0]}`}>
                                  {category.score}%
                                </span>
                              </div>
                              
                              {/* Progress Bar */}
                              <div className="w-full bg-slate-700 rounded-full h-2">
                                <motion.div
                                  className={`h-2 rounded-full ${
                                    category.score >= 80 ? 'bg-green-500' :
                                    category.score >= 60 ? 'bg-yellow-500' :
                                    category.score >= 40 ? 'bg-orange-500' :
                                    'bg-red-500'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${category.score}%` }}
                                  transition={{ duration: 0.8, delay: 0.2 + index * 0.1 }}
                                />
                              </div>
                              
                              {/* Description */}
                              <p className="text-xs text-slate-500 pl-6">
                                {category.description}
                              </p>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Analysis Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                  {/* Key Strengths */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="glass-card p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-400" />
                      <h3 className="text-lg font-semibold text-white">Key Strengths</h3>
                    </div>
                    <ul className="space-y-3">
                      {matchScore.reasons.map((reason, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.4 + index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <CheckCircle className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-300 leading-relaxed">{reason}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Improvement Areas */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="glass-card p-6"
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <Lightbulb className="h-5 w-5 text-yellow-400" />
                      <h3 className="text-lg font-semibold text-white">Improvement Areas</h3>
                    </div>
                    <ul className="space-y-3">
                      {matchScore.suggestions.map((suggestion, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.6 + index * 0.1 }}
                          className="flex items-start gap-3"
                        >
                          <Lightbulb className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-slate-300 leading-relaxed">{suggestion}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Additional Job Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="glass-card p-6 mt-6"
                >
                  <h3 className="text-lg font-semibold text-white mb-4">Job Details</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {app.employmentType && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Employment Type</p>
                        <p className="text-sm text-white capitalize">{app.employmentType.replace('_', ' ')}</p>
                      </div>
                    )}
                    {app.workLocation && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Work Mode</p>
                        <p className="text-sm text-white capitalize">{app.workLocation}</p>
                      </div>
                    )}
                    {app.salaryRange && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Salary Range</p>
                        <p className="text-sm text-white">{app.salaryRange}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs text-slate-500 mb-1">Applied</p>
                      <p className="text-sm text-white">{new Date(app.applicationDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
