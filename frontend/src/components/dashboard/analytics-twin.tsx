'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../auth-provider';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Zap, Activity, Award, TrendingUp, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

interface AnalyticsData {
  stats: {
    uploads: number;
    requests: number;
    bookmarks: number;
  };
  engagementScore: number;
  interpretation: string;
  trends: Array<{ name: string; value: number }>;
}

export function AnalyticsTwin() {
  const { user, session } = useAuth();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user || !session?.access_token) return;
      try {
        const token = session.access_token;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        const res = await fetch(`${backendUrl}/api/analytics/my-twin`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) setData(json);
      } catch (err) {
        console.error('Analytics fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [user, session]);

  if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-blue-500" /></div>;
  if (!data) return null;

  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899'];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Stats */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="rounded-2xl border-0 shadow-sm bg-white dark:bg-slate-900 overflow-hidden h-full">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" /> Digital Twin Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.trends}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                      {data.trends.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Engagement Card */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="rounded-2xl border-0 shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white h-full relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
              <TrendingUp className="h-32 w-32 rotate-12" />
            </div>
            <CardContent className="pt-6 h-full flex flex-col justify-between relative z-10">
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <motion.div 
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    className="p-2 bg-white/20 rounded-xl backdrop-blur-md"
                  >
                    <Award className="h-6 w-6 text-white" />
                  </motion.div>
                  <Badge className="bg-white/20 text-white border-0 hover:bg-white/30 px-3 py-1">
                    {data.interpretation}
                  </Badge>
                </div>
                <div>
                  <motion.h3 
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.3 }}
                    className="text-4xl font-bold"
                  >
                    {data.engagementScore}
                  </motion.h3>
                  <p className="text-blue-100 text-sm mt-1">Total Engagement Points</p>
                </div>
              </div>
              <div className="pt-6 space-y-2">
                <div className="flex justify-between text-xs text-blue-100">
                  <span>Progress to Next Rank</span>
                  <span>{Math.floor((data.engagementScore % 100))}%</span>
                </div>
                <div className="h-2 w-full bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${data.engagementScore % 100}%` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.5 }}
                    className="h-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Uploads', value: data.stats.uploads, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Requests', value: data.stats.requests, icon: Activity, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Bookmarks', value: data.stats.bookmarks, icon: Award, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/20' }
        ].map((item, i) => (
          <Card key={i} className="rounded-2xl border-0 shadow-sm bg-white dark:bg-slate-900">
            <CardContent className="pt-4 pb-4 flex flex-col items-center justify-center">
              <div className={`p-2 ${item.bg} rounded-lg mb-2`}>
                <item.icon className={`h-4 w-4 ${item.color}`} />
              </div>
              <span className="text-xl font-bold text-slate-900 dark:text-white">{item.value}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-bold tracking-tighter">{item.label}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  );
}
