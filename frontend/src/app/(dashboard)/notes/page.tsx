'use client';

import { ContentList } from '@/components/content/content-list';
import { UploadForm } from '@/components/content/upload-form';
import { BookOpen } from 'lucide-react';

export default function NotesPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-blue-600" />
            Study Notes
          </h1>
          <p className="text-slate-500 mt-1">Browse and download notes uploaded by the community.</p>
        </div>
        <UploadForm defaultType="notes" />
      </div>
      
      <ContentList type="notes" />
    </div>
  );
}
