import React from 'react';
import { BriefcaseBusiness, Eye, Calendar, TrendingUp, Clock, Percent } from 'lucide-react';
import { Stats } from '../types';
import { motion } from 'framer-motion';

interface StatsRowProps {
  stats: Stats;
}

export function StatsRow({ stats }: StatsRowProps) {
  const cards = [
    {
      title: "Total Applications",
      value: stats.total,
      icon: <BriefcaseBusiness className="h-5 w-5" />,
      color: "from-blue-500/20 to-blue-600/20",
    },
    {
      title: "Viewed",
      value: stats.viewed,
      icon: <Eye className="h-5 w-5" />,
      color: "from-emerald-500/20 to-emerald-600/20",
    },
    {
      title: "Interviews",
      value: stats.interviews,
      icon: <Calendar className="h-5 w-5" />,
      color: "from-violet-500/20 to-violet-600/20",
    },
    {
      title: "Offers",
      value: stats.offers,
      icon: <TrendingUp className="h-5 w-5" />,
      color: "from-cyan-500/20 to-cyan-600/20",
    },
    {
      title: "Response Rate",
      value: `${Math.round(stats.responseRate * 100)}%`,
      icon: <Percent className="h-5 w-5" />,
      color: "from-amber-500/20 to-amber-600/20",
    },
    {
      title: "Avg Response Time",
      value: `${Math.round(stats.avgResponseTime)} days`,
      icon: <Clock className="h-5 w-5" />,
      color: "from-rose-500/20 to-rose-600/20",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`glass-card p-4 bg-gradient-to-br ${card.color}`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="h-8 w-8 rounded-lg bg-white/10 grid place-items-center">
              {card.icon}
            </div>
          </div>
          <div className="text-2xl font-bold text-white">{card.value}</div>
          <div className="text-xs text-slate-300 mt-1">{card.title}</div>
        </motion.div>
      ))}
    </div>
  );
}
