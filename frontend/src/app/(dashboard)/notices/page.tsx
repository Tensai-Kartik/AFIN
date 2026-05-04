'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Loader2, Pin } from 'lucide-react';
import { format } from 'date-fns';
import { SubmitNoticeForm } from '@/components/notices/submit-notice-form';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';

export default function NoticesPage() {
  const [notices, setNotices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { user, dbUser } = useAuth();

  useEffect(() => {
    fetchNotices();
  }, []);

  const fetchNotices = async () => {
    try {
      const { data, error } = await supabase
        .from('notices')
        .select('*')
        .eq('status', 'approved')
        .is('deleted_at', null)
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

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/delete/notices/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Deleted successfully');
      fetchNotices();
      setDeleteId(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleting(false);
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
        <SubmitNoticeForm onSuccess={fetchNotices} />
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
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400 font-medium">{format(new Date(notice.created_at), 'MMM d, yyyy')}</span>
                    {(user?.id === notice.author_id || dbUser?.role === 'admin') && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                        onClick={() => setDeleteId(notice.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
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

      <DeleteConfirmModal 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
