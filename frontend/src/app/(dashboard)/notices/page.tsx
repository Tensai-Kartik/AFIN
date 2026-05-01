'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, Pin } from 'lucide-react';
import { format } from 'date-fns';

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('status', 'approved')
        .order('is_important', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotices(data || []);
    } catch (error) {
      console.error('Error fetching notices:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <Bell className="h-8 w-8 text-blue-600" />
            Notice Board
          </h1>
          <p className="text-slate-500 mt-1">Stay updated with the latest university announcements.</p>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : notices.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500">No active notices at the moment.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {notices.map((notice) => (
            <Card key={notice.id} className={`rounded-2xl shadow-sm border-0 ${notice.is_important ? 'border-2 border-red-100 bg-red-50/10' : ''}`}>
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <Badge variant={notice.is_important ? "destructive" : "secondary"} className="mb-2 uppercase text-[10px] tracking-wider">
                    {notice.is_important && <Pin className="w-3 h-3 mr-1 inline" />}
                    {notice.category}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium">{format(new Date(notice.created_at), 'MMM d, yyyy')}</span>
                </div>
                <CardTitle className={`text-xl ${notice.is_important ? 'text-red-900' : 'text-slate-900'}`}>{notice.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 whitespace-pre-wrap">{notice.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
