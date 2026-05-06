'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '../auth-provider';
import { Sparkles, FileText, ChevronRight, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface Recommendation {
  id: string;
  title: string;
  type: string;
  subject: string;
  semester: number;
}

export function Recommendations() {
  const { user, session } = useAuth();
  const [items, setItems] = useState<Recommendation[]>([]);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecs = async () => {
      if (!user || !session?.access_token) return;
      try {
        const token = session.access_token;
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

        const res = await fetch(`${backendUrl}/api/recommendations`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setItems(data.recommendations);
          setReason(data.reason);
        }
      } catch (err) {
        console.error('Recs fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRecs();
  }, [user, session]);

  if (loading) return <div className="flex justify-center p-6"><Loader2 className="animate-spin text-blue-500 h-6 w-6" /></div>;
  if (items.length === 0) return null;

  return (
    <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden">
      <CardHeader className="pb-3 border-b border-slate-50">
        <div className="flex justify-between items-center">
          <CardTitle className="text-sm font-bold flex items-center gap-2 text-slate-800">
            <Sparkles className="h-4 w-4 text-purple-500" /> Recommended For You
          </CardTitle>
          <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
            {reason}
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {items.map((item) => (
            <Link 
              key={item.id} 
              href={`/${item.type === 'pyq' ? 'pyqs' : item.type === 'assignment' ? 'assignments' : 'notes'}`}
              className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors group"
            >
              <div className="p-2 bg-slate-100 rounded-xl group-hover:bg-blue-100 group-hover:text-blue-600 transition-colors">
                <FileText className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-slate-900 truncate">{item.title}</p>
                <p className="text-xs text-slate-500 truncate">{item.subject} • Sem {item.semester}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
