'use client';

import { ContentList } from '@/components/content/content-list';
import { UploadForm } from '@/components/content/upload-form';
import { FileText } from 'lucide-react';

export default function PYQsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <FileText className="h-8 w-8 text-blue-600" />
            Previous Year Questions (PYQs)
          </h1>
          <p className="text-slate-500 mt-1">Browse and download previous year question papers.</p>
        </div>
        <UploadForm defaultType="pyqs" />
      </div>
      
      <ContentList type="pyqs" />
    </div>
  );
}
