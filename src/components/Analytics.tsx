import React, { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, CartesianGrid, Legend
} from 'recharts';
import { ApplicationRec } from '../types';
import { format, subDays, startOfDay } from 'date-fns';

interface AnalyticsProps {
  applications: ApplicationRec[];
}

const COLORS = {
  pending: '#f59e0b',
  viewed: '#10b981',
  interview_requested: '#8b5cf6',
  offer: '#06b6d4',
  rejected: '#ef4444'
};

export function Analytics({ applications }: AnalyticsProps) {
  const trendData = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = startOfDay(subDays(new Date(), 29 - i));
      const dateStr = format(date, 'yyyy-MM-dd');
      const count = applications.filter(
        app => format(new Date(app.applicationDate), 'yyyy-MM-dd') === dateStr
      ).length;
      return {
        date: format(date, 'MMM d'),
        applications: count
      };
    });
    return last30Days;
  }, [applications]);

  const statusDistribution = useMemo(() => {
    const distribution = {
      pending: 0,
      viewed: 0,
      interview_requested: 0,
      offer: 0,
      rejected: 0
    };
    
    applications.forEach(app => {
      distribution[app.status]++;
    });
    
    return Object.entries(distribution)
      .filter(([_, value]) => value > 0)
      .map(([name, value]) => ({
        name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        value,
        color: COLORS[name as keyof typeof COLORS]
      }));
  }, [applications]);

  const responseTimeData = useMemo(() => {
    const times: { [key: string]: number[] } = {
      '0-3 days': [],
      '4-7 days': [],
      '1-2 weeks': [],
      '2+ weeks': []
    };
    
    applications
      .filter(app => app.responseDate)
      .forEach(app => {
        const days = Math.floor(
          (new Date(app.responseDate!).getTime() - new Date(app.applicationDate).getTime()) 
          / (1000 * 60 * 60 * 24)
        );
        
        if (days <= 3) times['0-3 days'].push(days);
        else if (days <= 7) times['4-7 days'].push(days);
        else if (days <= 14) times['1-2 weeks'].push(days);
        else times['2+ weeks'].push(days);
      });
    
    return Object.entries(times).map(([range, values]) => ({
      range,
      count: values.length
    }));
  }, [applications]);

  return (
    <div className="glass-card p-6 space-y-6">
      <h2 className="text-lg font-semibold text-white">Analytics</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Application Trend */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Application Trend (30 days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  interval="preserveStartEnd"
                />
                <YAxis 
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="applications" 
                  stroke="#0077b5" 
                  strokeWidth={2}
                  dot={{ fill: '#0077b5', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Status Distribution */}
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-slate-300">Status Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Response Time Distribution */}
        <div className="space-y-2 lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300">Response Time Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="range" 
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                />
                <YAxis 
                  tick={{ fill: '#cbd5e1', fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(15, 23, 42, 0.9)', 
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="count" fill="#0077b5" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
