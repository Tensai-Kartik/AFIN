'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Activity, User, BookOpen, Upload, Download, MessageSquare, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { motion } from 'framer-motion';

export default function DigitalTwinPage() {
  const { session } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTwinData = async () => {
      if (!session?.access_token) return;
      try {
        const token = session.access_token;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/digital-twin`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const json = await res.json();
        if (res.ok) setData(json);
      } catch (err) {
        console.error('Digital Twin fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchTwinData();
  }, [session]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[50vh]">
        <Loader2 className="h-10 w-10 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-slate-800">No Data Available</h2>
        <p className="text-slate-500">We couldn't generate your digital twin at this time.</p>
      </div>
    );
  }

  const getRiskColor = (risk: string) => {
    if (risk === 'high') return 'bg-red-100 text-red-700 border-red-200';
    if (risk === 'medium') return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const getEngagementColor = (score: string) => {
    if (score === 'high') return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    if (score === 'medium') return 'bg-blue-100 text-blue-700 border-blue-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Activity className="h-8 w-8 text-blue-600" /> 
          Student Digital Twin
        </h1>
        <p className="text-slate-500 mt-1">Real-time insights into your academic behavior and engagement.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Attendance & Basic Stats */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card className="rounded-2xl border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BookOpen className="h-5 w-5 text-blue-500" /> Attendance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-4">
                <div className="relative h-32 w-32 rounded-full border-8 border-slate-100 flex items-center justify-center">
                  <div 
                    className="absolute inset-0 rounded-full border-8 border-blue-500"
                    style={{ 
                      clipPath: `polygon(0 0, 100% 0, 100% 100%, 0 100%)`, 
                      transform: `rotate(${(data.attendance / 100) * 360}deg)` // Very simple visual hack or just use a standard circle
                    }}
                  />
                  <div className="bg-white absolute inset-2 rounded-full flex flex-col items-center justify-center z-10">
                    <span className="text-3xl font-bold text-slate-900">{data.attendance}%</span>
                  </div>
                </div>
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Target: 75% minimum
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Card className="rounded-2xl border-0 shadow-sm h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-indigo-500" /> Platform Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Upload className="h-4 w-4 text-slate-600" /></div>
                    <span className="font-medium text-slate-700">Uploads</span>
                  </div>
                  <span className="font-bold text-slate-900">{data.activity.uploads}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><Download className="h-4 w-4 text-slate-600" /></div>
                    <span className="font-medium text-slate-700">Downloads</span>
                  </div>
                  <span className="font-bold text-slate-900">{data.activity.downloads}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="bg-white p-2 rounded-lg shadow-sm"><MessageSquare className="h-4 w-4 text-slate-600" /></div>
                    <span className="font-medium text-slate-700">Requests</span>
                  </div>
                  <span className="font-bold text-slate-900">{data.activity.requests}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Risk Indicators */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="rounded-2xl border-0 shadow-sm h-full bg-slate-900 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg text-white">
                <AlertTriangle className="h-5 w-5 text-amber-400" /> Status Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                <div>
                  <p className="text-slate-400 text-sm mb-2">Engagement Score</p>
                  <Badge variant="outline" className={`px-3 py-1 ${getEngagementColor(data.engagement_score)} uppercase`}>
                    {data.engagement_score}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Burnout Risk</p>
                  <Badge variant="outline" className={`px-3 py-1 ${getRiskColor(data.risk_indicators.burnout_risk)} uppercase`}>
                    {data.risk_indicators.burnout_risk}
                  </Badge>
                </div>
                <div>
                  <p className="text-slate-400 text-sm mb-2">Failure Risk</p>
                  <Badge variant="outline" className={`px-3 py-1 ${getRiskColor(data.risk_indicators.failure_risk)} uppercase`}>
                    {data.risk_indicators.failure_risk}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Suggested Study Plan */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
        <Card className="rounded-2xl border-0 shadow-sm border-l-4 border-l-blue-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" /> Suggested Action Plan
            </CardTitle>
            <CardDescription>Generated based on your current metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {data.suggested_actions.map((action: string, i: number) => (
                <li key={i} className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-xl text-slate-700">
                  <div className="mt-1 bg-blue-100 rounded-full p-1"><CheckCircle className="h-3 w-3 text-blue-600" /></div>
                  <span className="leading-relaxed">{action}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </motion.div>

    </div>
  );
}
