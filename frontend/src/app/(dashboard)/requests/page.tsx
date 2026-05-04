'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, Loader2, Plus, CornerDownRight, Lock } from 'lucide-react';
import { format } from 'date-fns';
import { RequireVerification } from '@/components/require-verification';
import { SubmitRequestForm } from '@/components/requests/submit-request-form';
import { UploadForm } from '@/components/content/upload-form';
import { ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export default function RequestsPage() {
  const { isVerified, user, dbUser } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfig, setDeleteConfig] = useState<{ id: string, module: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('requests')
        .select(`
          *, 
          users(full_name, prn),
          content(
            id, 
            title, 
            file_url, 
            status, 
            uploader_id,
            created_at,
            deleted_at,
            users(full_name, prn)
          )
        `)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfig) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/delete/${deleteConfig.module}/${deleteConfig.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Deleted successfully');
      fetchRequests(); // Refresh the list
      setDeleteConfig(null);
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
            <MessageSquare className="h-8 w-8 text-blue-600" />
            Student Requests
          </h1>
          <p className="text-slate-500 mt-1">Ask for notes, solutions, or help from peers.</p>
        </div>

        <SubmitRequestForm onSuccess={fetchRequests} />
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
                  {(user?.id === req.author_id || dbUser?.role === 'admin') && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg -mr-2"
                      onClick={() => setDeleteConfig({ id: req.id, module: 'requests' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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

                {/* Solutions Section */}
                {req.content && req.content.length > 0 && (
                  <div className="mt-6 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <CornerDownRight className="h-3 w-3" /> Responses / Solutions
                    </h4>
                    <div className="space-y-2">
                      {req.content.filter((sol: any) => !sol.deleted_at).map((sol: any) => (
                        <div key={sol.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 group transition-all hover:border-blue-200 hover:bg-blue-50/30">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${sol.status === 'approved' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                              {sol.status === 'approved' ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-900 leading-none">{sol.title}</p>
                              <p className="text-[10px] text-slate-500 mt-1">
                                by {sol.users?.full_name} • {format(new Date(sol.created_at), 'MMM d')}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            {sol.status === 'approved' ? (
                              <Button variant="ghost" size="sm" className="rounded-lg h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-100/50" nativeButton={false} render={<a href={sol.file_url} target="_blank" rel="noreferrer" />}>
                                <ExternalLink className="h-3.5 w-3.5 mr-1.5" /> View
                              </Button>
                            ) : (
                              <Badge variant="secondary" className="text-[10px] bg-slate-200 text-slate-600 border-0">
                                Pending Approval
                              </Badge>
                            )}

                            {(user?.id === sol.uploader_id || dbUser?.role === 'admin') && (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                                onClick={() => setDeleteConfig({ id: sol.id, module: 'content' })}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="bg-slate-50 border-t border-slate-100 py-3 rounded-b-2xl">
                <UploadForm 
                  requestId={req.id}
                  prefilledTitle={`Solution: ${req.title}`}
                  prefilledSubject={req.subject}
                  defaultType="solutions"
                  onSuccess={fetchRequests}
                  customTrigger={
                    <Button variant="ghost" size="sm" className="text-slate-500 hover:text-blue-600 rounded-lg font-medium">
                      <CornerDownRight className="mr-2 h-4 w-4" /> Reply with Content
                    </Button>
                  }
                />
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <DeleteConfirmModal 
        open={!!deleteConfig}
        onOpenChange={(open) => !open && setDeleteConfig(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
