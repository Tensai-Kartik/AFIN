'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, Bookmark, Loader2, FileText, Image as ImageIcon, BadgeCheck } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '../auth-provider';
import { toast } from 'sonner';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { Trash2 } from 'lucide-react';

interface ContentItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: number;
  file_url: string;
  created_at: string;
  users: {
    full_name: string;
    prn: string;
  };
  uploader_id: string;
}

export function ContentList({ type }: { type: 'notes' | 'pyqs' | 'assignments' | 'solutions' }) {
  const { user, dbUser } = useAuth();
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchContent();
    if (user) {
      fetchBookmarks();
    }
  }, [type, user]);

  const fetchBookmarks = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/bookmarks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const ids = new Set(data.bookmarks.map((b: any) => b.content_id));
      setBookmarkedIds(ids as Set<string>);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
    }
  };

  const toggleBookmark = async (contentId: string) => {
    if (!user) {
      toast.error('You must be logged in to bookmark.');
      return;
    }

    setTogglingId(contentId);
    const isBookmarked = bookmarkedIds.has(contentId);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const endpoint = isBookmarked ? '/api/bookmarks/remove' : '/api/bookmarks/add';
      const method = isBookmarked ? 'DELETE' : 'POST';

      const res = await fetch(`${backendUrl}${endpoint}`, {
        method,
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content_id: contentId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (isBookmarked) {
          next.delete(contentId);
        } else {
          next.add(contentId);
        }
        return next;
      });

      toast.success(isBookmarked ? 'Removed from bookmarks' : 'Added to bookmarks');
    } catch (error: any) {
      console.error('Error toggling bookmark:', error);
      toast.error(error.message || 'Failed to update bookmark');
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/delete/content/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Deleted successfully');
      setContent(prev => prev.filter(item => item.id !== deleteId));
      setDeleteId(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id, title, description, subject, semester, file_url, created_at, uploader_id,
          users (full_name, prn)
        `)
        .eq('type', type)
        .eq('status', 'approved')
        .is('deleted_at', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setContent(data as any || []);
    } catch (error) {
      console.error('Error fetching content:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (content.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 border-dashed">
        <p className="text-slate-500">No approved {type} available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {content.map((item) => {
        const isPdf = item.file_url.toLowerCase().includes('.pdf');
        
        return (
          <Card key={item.id} className="group overflow-hidden rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
              <div className="flex justify-between items-start gap-4">
                <div className="space-y-1">
                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-2">
                    Sem {item.semester} • {item.subject}
                  </Badge>
                  <CardTitle className="line-clamp-2 leading-tight text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                    {item.title}
                  </CardTitle>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-green-600">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified Content
                  </div>
                </div>
                {isPdf ? (
                  <div className="bg-red-50 p-2 rounded-lg text-red-500">
                    <FileText className="h-5 w-5" />
                  </div>
                ) : (
                  <div className="bg-green-50 p-2 rounded-lg text-green-500">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-2">
              <p className="text-sm text-slate-500 line-clamp-3 mb-4 h-[60px]">
                {item.description || 'No description provided.'}
              </p>
              <div className="flex items-center text-xs text-slate-400 font-medium">
                <span className="truncate flex-1">By {item.users?.full_name} ({item.users?.prn})</span>
                <span className="shrink-0 ml-2">{format(new Date(item.created_at), 'MMM d, yyyy')}</span>
              </div>
            </CardContent>
            <CardFooter className="pt-2 pb-4 gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg hover:bg-slate-50"
                nativeButton={false}
                render={
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                    <Eye className="mr-2 h-4 w-4" /> View
                  </a>
                }
              />
              <Button
                variant="outline"
                size="sm"
                className="flex-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200"
                nativeButton={false}
                render={
                  <a href={item.file_url} download>
                    <Download className="mr-2 h-4 w-4" /> Save
                  </a>
                }
              />
              <Button 
                variant="ghost" 
                size="icon" 
                className={`shrink-0 rounded-lg transition-colors ${bookmarkedIds.has(item.id) ? 'text-yellow-500 bg-yellow-50 hover:bg-yellow-100 hover:text-yellow-600' : 'text-slate-400 hover:text-yellow-500 hover:bg-yellow-50'}`}
                onClick={() => toggleBookmark(item.id)}
                disabled={togglingId === item.id}
              >
                {togglingId === item.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Bookmark className={`h-4 w-4 ${bookmarkedIds.has(item.id) ? 'fill-current' : ''}`} />
                )}
              </Button>
              {(user?.id === item.uploader_id || dbUser?.role === 'admin') && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                  onClick={() => setDeleteId(item.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </CardFooter>
          </Card>
        );
      })}

      <DeleteConfirmModal 
        open={!!deleteId} 
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
