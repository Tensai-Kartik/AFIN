'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, Plus, MessageSquare } from 'lucide-react';
import { RequireVerification } from '../require-verification';
import { supabase } from '@/lib/supabase';

interface SubmitRequestFormProps {
  onSuccess?: () => void;
}

export function SubmitRequestForm({ onSuccess }: SubmitRequestFormProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !subject || !description) {
      toast.error('Please fill all fields.');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/requests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, subject, description })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit request.');
      }

      toast.success('Request posted successfully!');
      setOpen(false);
      resetForm();
      if (onSuccess) onSuccess();

    } catch (error: any) {
      console.error('Request submission error:', error);
      toast.error(error.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setSubject('');
    setDescription('');
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <RequireVerification>
        <DialogTrigger
          render={
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
              <Plus className="mr-2 h-4 w-4" /> New Request
            </Button>
          }
        />
      </RequireVerification>
      <DialogContent className="sm:max-w-[500px] rounded-2xl border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" />
            Create Request
          </DialogTitle>
          <DialogDescription>
            Ask the community for notes, PYQs, solutions, or general help.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Need Unit 3 Notes for OS"
              className="rounded-xl"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="subject">Subject / Course *</Label>
            <Input
              id="subject"
              required
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Operating Systems"
              className="rounded-xl"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Details *</Label>
            <Textarea
              id="desc"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more context about what exactly you're looking for..."
              className="rounded-xl resize-none h-24"
            />
          </div>
          
          <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Post Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
