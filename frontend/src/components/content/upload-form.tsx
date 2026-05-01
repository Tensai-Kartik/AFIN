'use client';

import { useState } from 'react';
import { useAuth } from '../auth-provider';
import { uploadContent } from '@/lib/storage';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, UploadCloud, Lock } from 'lucide-react';
import Link from 'next/link';

interface UploadFormProps {
  defaultType?: 'notes' | 'pyqs' | 'assignments' | 'solutions';
  onSuccess?: () => void;
}

export function UploadForm({ defaultType = 'notes', onSuccess }: UploadFormProps) {
  const { user, dbUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('');
  const [semester, setSemester] = useState('1');
  const [type, setType] = useState(defaultType);
  const [file, setFile] = useState<File | null>(null);

  const isVerifiedStudent = dbUser?.role === 'verified_student' || dbUser?.role === 'admin';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !title || !subject || !semester || !type) {
      toast.error('Please fill all required fields and select a file.');
      return;
    }

    if (!user) {
      toast.error('You must be logged in.');
      return;
    }

    setIsUploading(true);

    try {
      // 1. Upload to Storage
      const fileUrl = await uploadContent(file, user.id, type as any);

      // 2. Insert into Database
      const { error } = await supabase.from('content').insert({
        title,
        description,
        subject,
        semester: parseInt(semester),
        type,
        file_url: fileUrl,
        uploader_id: user.id,
        status: 'pending', // Requires admin approval
      });

      if (error) throw error;

      toast.success('Upload submitted successfully! Awaiting admin approval.');
      setOpen(false);
      resetForm();
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload content.');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSubject('');
    setSemester('1');
    setType(defaultType);
    setFile(null);
  };

  if (!isVerifiedStudent) {
    return (
      <Link href="/profile">
        <Button
          variant="secondary"
          className="rounded-xl text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200"
        >
          <Lock className="mr-2 h-4 w-4" />
          Verify to Upload
        </Button>
      </Link>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
          <UploadCloud className="mr-2 h-4 w-4" />
          Upload Content
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl">
        <DialogHeader>
          <DialogTitle>Upload New Content</DialogTitle>
          <DialogDescription>
            Share your notes, assignments, or PYQs with the community. All uploads require admin approval.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Data Structures Unit 1"
                className="rounded-xl"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input
                id="subject"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. CS101"
                className="rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="semester">Semester *</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>Semester {sem}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="type">Content Type *</Label>
              <Select value={type} onValueChange={(val) => setType(val as any)}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="notes">Notes</SelectItem>
                  <SelectItem value="pyqs">PYQs</SelectItem>
                  <SelectItem value="assignments">Assignments</SelectItem>
                  <SelectItem value="solutions">Solutions</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Briefly describe the content..."
                className="rounded-xl resize-none h-20"
              />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="file">File (PDF/Images) *</Label>
              <Input
                id="file"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-slate-500 mt-1">Max size: 10MB.</p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isUploading} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit Upload'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
