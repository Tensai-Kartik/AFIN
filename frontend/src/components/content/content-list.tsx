'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download, Eye, Bookmark, Loader2, FileText, Image as ImageIcon } from 'lucide-react';
import { format } from 'date-fns';

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
}

export function ContentList({ type }: { type: 'notes' | 'pyqs' | 'assignments' | 'solutions' }) {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, [type]);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id, title, description, subject, semester, file_url, created_at,
          users (full_name, prn)
        `)
        .eq('type', type)
        .eq('status', 'approved')
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
              <Button variant="outline" size="sm" className="flex-1 rounded-lg hover:bg-slate-50" asChild>
                <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                  <Eye className="mr-2 h-4 w-4" /> View
                </a>
              </Button>
              <Button variant="outline" size="sm" className="flex-1 rounded-lg hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200" asChild>
                <a href={item.file_url} download>
                  <Download className="mr-2 h-4 w-4" /> Save
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="shrink-0 rounded-lg text-slate-400 hover:text-yellow-500 hover:bg-yellow-50">
                <Bookmark className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
