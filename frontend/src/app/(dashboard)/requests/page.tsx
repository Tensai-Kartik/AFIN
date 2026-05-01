'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, Plus, CornerDownRight, Lock } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

export default function RequestsPage() {
  const { isVerified } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`*, users(full_name, prn)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Student Requests
          </h1>
          <p className="text-slate-500 mt-1">Ask for notes, solutions, or help from peers.</p>
        </div>

        {isVerified ? (
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> New Request
          </Button>
        ) : (
          <Link href="/profile">
            <Button
              variant="secondary"
              className="rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
            >
              <Lock className="mr-2 h-4 w-4" /> Verify to Request
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : requests.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500">No requests right now. You can start by asking for help!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((req) => (
            <Card key={req.id} className="rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-1 rounded-md">
                      {req.subject}
                    </span>
                    <CardTitle className="text-xl pt-2">{req.title}</CardTitle>
                  </div>
                  <span className="text-xs text-slate-400 font-medium shrink-0">
                    {format(new Date(req.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-slate-600">{req.description}</p>
                <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
                  <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 font-bold">
                    {req.users?.full_name?.charAt(0)}
                  </div>
                  <span>{req.users?.full_name} ({req.users?.prn})</span>
                </div>
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 py-3 rounded-b-2xl">
                {isVerified ? (
                  <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 rounded-lg">
                    <CornerDownRight className="mr-2 h-4 w-4" /> Reply with Content
                  </Button>
                ) : (
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="text-amber-600 hover:text-amber-700 rounded-lg">
                      <Lock className="mr-2 h-4 w-4" /> Verify to Reply
                    </Button>
                  </Link>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
