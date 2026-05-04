'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

import { toast } from 'sonner';
import { Loader2, Bell } from 'lucide-react';
import { RequireVerification } from '../require-verification';
import { supabase } from '@/lib/supabase';

interface SubmitNoticeFormProps {
  onSuccess?: () => void;
}

export function SubmitNoticeForm({ onSuccess }: SubmitNoticeFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [isImportant, setIsImportant] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !category || !description) {
      toast.error('Please fill all required fields.');
      return;
    }

    setIsSubmitting(true);
    console.log('Submitting notice with payload:', { title, category, description, is_important: isImportant });

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/notices/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          title, 
          category, 
          description,
          is_important: isImportant
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit notice.');
      }

      toast.success('Notice submitted successfully! Awaiting admin approval.');
      setOpen(false);
      resetForm();
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Notice submission error:', error);
      toast.error(error.message || 'Failed to submit notice.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setCategory('');
    setDescription('');
    setIsImportant(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <RequireVerification>
        <DialogTrigger
          render={
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              <Bell className="mr-2 h-4 w-4" /> Submit Notice
            </Button>
          }
        />
      </RequireVerification>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-blue-500" />
            Submit Notice
          </DialogTitle>
          <DialogDescription>
            Share an important announcement or event. All notices require admin approval before being visible to everyone.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Notice Title *</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. End Semester Exam Timetable"
              className="rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={(val) => val && setCategory(val)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="exams">Exam</SelectItem>
                <SelectItem value="events">Event</SelectItem>
                <SelectItem value="placements">Placement</SelectItem>
                <SelectItem value="deadlines">Deadline</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Notice Content *</Label>
            <Textarea
              id="desc"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Write the full details of the notice here..."
              className="rounded-xl resize-none h-32"
            />
          </div>

          <div className="flex items-center gap-3 p-3 border border-slate-100 rounded-xl bg-slate-50 cursor-pointer" onClick={() => setIsImportant(v => !v)}>
            <input
              type="checkbox"
              id="important"
              checked={isImportant}
              onChange={(e) => setIsImportant(e.target.checked)}
              className="w-4 h-4 rounded accent-blue-600 cursor-pointer"
            />
            <div className="space-y-0.5">
              <Label htmlFor="important" className="text-base cursor-pointer">Mark as Important</Label>
              <p className="text-xs text-slate-500">Important notices are highlighted in red.</p>
            </div>
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Submit for Approval'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
