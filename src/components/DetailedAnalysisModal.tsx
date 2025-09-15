import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Target, TrendingUp, Brain, MapPin, DollarSign, 
  Briefcase, CheckCircle, AlertCircle, Lightbulb,
  BarChart3, User, Building2
} from 'lucide-react';
import { ApplicationRec } from '../types';
import { getScoreColor, formatScore } from '../aiScoring';

interface DetailedAnalysisModalProps {
  app: ApplicationRec | null;
  isOpen: boolean;
  onClose: () => void;
}

interface ScoreBarProps {
  label: string;
  score: number;
  icon: React.ReactNode;
}

function ScoreBar({ label, score, icon }: ScoreBarProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-sm font-medium text-slate-300">{label}</span>
        </div>
        <span className={`text-sm font-bold px-2 py-1 rounded-full ${getScoreColor(score).replace('border-', 'bg-').replace('/50', '/10')}`}>
          {score}%
        </span>
      </div>
      <div className="w-full bg-slate-700 rounded-full h-2">
        <motion.div
          className={`h-2 rounded-full ${getScoreColor(score).split(' ')[0].replace('text-', 'bg-').replace('-400', '-500')}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
    </div>
  );
}

export function DetailedAnalysisModal({ app, isOpen, onClose }: DetailedAnalysisModalProps) {
  if (!app || !app.matchScore) return null;

  const { matchScore } = app;

  const scoreCategories = [
    {
      label: 'Skills Match',
      score: matchScore.skills,
      icon: <Brain className="h-4 w-4 text-purple-400" />,
      description: 'How well your technical skills align with job requirements'
    },
    {
      label: 'Experience Level',
      score: matchScore.experience,
      icon: <User className="h-4 w-4 text-blue-400" />,
      description: 'Your experience level vs. the position requirements'
    },
    {
      label: 'Location Fit',
      score: matchScore.location,
      icon: <MapPin className="h-4 w-4 text-green-400" />,
      description: 'Geographic compatibility and remote work preferences'
    },
    {
      label: 'Compensation',
      score: matchScore.salary,
      icon: <DollarSign className="h-4 w-4 text-yellow-400" />,
      description: 'Salary expectations vs. offered compensation'
    }
  ];

  const getOverallScoreText = (score: number) => {
    if (score >= 85) return { text: 'Excellent Match', color: 'text-green-400' };
    if (score >= 70) return { text: 'Strong Match', color: 'text-cyan-400' };
    if (score >= 55) return { text: 'Good Match', color: 'text-yellow-400' };
    if (score >= 40) return { text: 'Moderate Match', color: 'text-orange-400' };
    return { text: 'Weak Match', color: 'text-red-400' };
  };

  const overallScore = getOverallScoreText(matchScore.overall);

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
                      <div className="relative mb-4">
                        <motion.div
                          className="w-32 h-32 mx-auto rounded-full border-8 border-slate-700 flex items-center justify-center relative"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <motion.div
                            className={`absolute inset-0 rounded-full border-8 ${getScoreColor(matchScore.overall).split(' ')[2]}`}
                            style={{
                              background: `conic-gradient(${getScoreColor(matchScore.overall).split(' ')[0].replace('text-', '').replace('-400', '')} ${matchScore.overall * 3.6}deg, transparent 0deg)`
                            }}
                            initial={{ rotate: -90 }}
                            animate={{ rotate: -90 }}
                          />
                          <div className="text-center relative z-10">
                            <div className={`text-3xl font-bold ${getScoreColor(matchScore.overall).split(' ')[0]}`}>
                              {matchScore.overall}%
                            </div>
                            <div className={`text-sm font-medium ${overallScore.color}`}>
                              {overallScore.text}
                            </div>
                          </div>
                        </motion.div>
                      </div>
                      <p className="text-sm text-slate-400">
                        Based on AI analysis of your profile vs. job requirements
                      </p>
                    </div>
                  </div>

                  {/* Detailed Breakdown */}
                  <div className="lg:col-span-2">
                    <div className="glass-card p-6">
                      <div className="flex items-center gap-2 mb-6">
                        <BarChart3 className="h-5 w-5 text-cyan-400" />
                        <h3 className="text-xl font-semibold text-white">Score Breakdown</h3>
                      </div>
                      <div className="space-y-6">
                        {scoreCategories.map((category, index) => (
                          <motion.div
                            key={category.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <ScoreBar
                              label={category.label}
                              score={category.score}
                              icon={category.icon}
                            />
                            <p className="text-xs text-slate-500 mt-1 ml-6">
                              {category.description}
                            </p>
                          </motion.div>
                        ))}
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
                          <div className="w-2 h-2 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{reason}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>

                  {/* Improvement Suggestions */}
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
                          <div className="w-2 h-2 rounded-full bg-yellow-400 mt-2 flex-shrink-0" />
                          <span className="text-sm text-slate-300">{suggestion}</span>
                        </motion.li>
                      ))}
                    </ul>
                  </motion.div>
                </div>

                {/* Job Details */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="glass-card p-6 mt-6"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="h-5 w-5 text-cyan-400" />
                    <h3 className="text-lg font-semibold text-white">Position Details</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="text-slate-400 mb-1">Location</div>
                      <div className="text-white flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {app.location}
                        {app.workLocation && (
                          <span className="px-2 py-1 bg-blue-500/20 text-blue-300 rounded text-xs capitalize">
                            {app.workLocation}
                          </span>
                        )}
                      </div>
                    </div>
                    {app.salaryRange && (
                      <div>
                        <div className="text-slate-400 mb-1">Salary Range</div>
                        <div className="text-white flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          {app.salaryRange}
                        </div>
                      </div>
                    )}
                    {app.employmentType && (
                      <div>
                        <div className="text-slate-400 mb-1">Employment Type</div>
                        <div className="text-white flex items-center gap-2">
                          <Briefcase className="h-4 w-4" />
                          <span className="capitalize">{app.employmentType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>

                {/* Analysis Metadata */}
                <div className="text-center mt-6 text-xs text-slate-500">
                  Analysis calculated on {new Date(matchScore.calculatedAt).toLocaleString()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}