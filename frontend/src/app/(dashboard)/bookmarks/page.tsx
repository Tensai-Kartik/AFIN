'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Bookmark, LayoutGrid, Loader2, Eye, Download, FileText, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function BookmarksPage() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) {
        setLoading(false);
        return;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/bookmarks`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error);
      
      setBookmarks(data.bookmarks || []);
    } catch (error) {
      console.error('Error fetching bookmarks:', error);
      toast.error('Failed to load bookmarks');
    } finally {
      setLoading(false);
    }
  };

  const removeBookmark = async (contentId: string) => {
    setRemovingId(contentId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/bookmarks/remove`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content_id: contentId })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setBookmarks(prev => prev.filter(b => b.content_id !== contentId));
      toast.success('Bookmark removed');
    } catch (error: any) {
      console.error('Error removing bookmark:', error);
      toast.error(error.message || 'Failed to remove bookmark');
    } finally {
      setRemovingId(null);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Bookmark className="h-8 w-8 text-blue-600" />
          My Bookmarks
        </h1>
        <p className="text-slate-500 mt-1">Saved notes, pyqs and assignments for quick access.</p>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : (
        <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="bg-slate-100 p-1 rounded-xl h-12 mb-6">
            <TabsTrigger value="all" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">All</TabsTrigger>
            <TabsTrigger value="notes" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Notes</TabsTrigger>
            <TabsTrigger value="pyqs" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">PYQs</TabsTrigger>
            <TabsTrigger value="assignments" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Assignments</TabsTrigger>
            <TabsTrigger value="solutions" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">Solutions</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-0">
            {bookmarks.filter(b => activeTab === 'all' || b.content?.type === activeTab).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
                <div className="bg-slate-50 p-4 rounded-full mb-4">
                  <Bookmark className="h-10 w-10 text-slate-300" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">No {activeTab !== 'all' ? activeTab : ''} bookmarks yet</h2>
                <p className="text-slate-500 mt-2 max-w-xs text-center">
                  Save your favorite {activeTab !== 'all' ? activeTab : 'resources'} to find them here easily later.
                </p>
                <Link href={activeTab !== 'all' ? `/${activeTab}` : '/notes'} className="mt-6">
                  <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
                    <LayoutGrid className="mr-2 h-4 w-4" /> Browse {activeTab !== 'all' ? activeTab : 'Resources'}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {bookmarks
                  .filter(b => activeTab === 'all' || b.content?.type === activeTab)
                  .map((bookmark) => {
                    const item = bookmark.content;
                    if (!item) return null;
                    const isPdf = item.file_url?.toLowerCase().includes('.pdf');
                    
                    return (
                      <Card key={bookmark.id} className="group overflow-hidden rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300">
                        <CardHeader className="pb-3 border-b border-slate-50 bg-slate-50/50">
                          <div className="flex justify-between items-start gap-4">
                            <div className="space-y-1">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-2 uppercase text-[10px] font-bold tracking-wider">
                                {item.type} • Sem {item.semester}
                              </Badge>
                              <CardTitle className="line-clamp-2 leading-tight text-lg text-slate-900 group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </CardTitle>
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
                            <span className="truncate flex-1">By {item.users?.full_name || 'Unknown'}</span>
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
                            className="shrink-0 rounded-lg text-yellow-500 bg-yellow-50 hover:bg-yellow-100 hover:text-yellow-600"
                            onClick={() => removeBookmark(item.id)}
                            disabled={removingId === item.id}
                          >
                            {removingId === item.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Bookmark className="h-4 w-4" fill="currentColor" />
                            )}
                          </Button>
                        </CardFooter>
                      </Card>
                    );
                  })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
