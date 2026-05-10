'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { MessageSquarePlus, Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { v4 as uuidv4 } from 'uuid';

export function AppFeedbackModal() {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  
  const [formData, setFormData] = useState({
    feedback_type: '',
    subject: '',
    message: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.feedback_type || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      let screenshot_url = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `feedback/${uuidv4()}.${fileExt}`;
        
        const { error: uploadError, data } = await supabase.storage
          .from('afin-storage')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from('afin-storage')
          .getPublicUrl(fileName);

        screenshot_url = publicUrlData.publicUrl;
      }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/feedback/app`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...formData,
          screenshot_url
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit feedback');
      }

      toast.success('Feedback submitted successfully. Thank you!');
      setOpen(false);
      setFormData({ feedback_type: '', subject: '', message: '' });
      setFile(null);
    } catch (error: any) {
      toast.error(error.message || 'An error occurred while submitting feedback');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full outline-none cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-center group" title="Submit Feedback">
            <MessageSquarePlus className="h-5 w-5 text-slate-600 group-hover:text-blue-600 transition-colors" />
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-slate-950 border-slate-800 text-slate-50">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-900 to-purple-900/20 opacity-50" />
        <div className="relative p-6">
          <DialogHeader className="mb-6">
            <DialogTitle className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              <MessageSquarePlus className="h-6 w-6 text-blue-500" />
              App Feedback
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Help us improve AFIN. Share your thoughts, report bugs, or suggest new features.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="type" className="text-slate-300">Feedback Type <span className="text-red-500">*</span></Label>
              <Select value={formData.feedback_type} onValueChange={(val) => setFormData(prev => ({ ...prev, feedback_type: val }))}>
                <SelectTrigger id="type" className="bg-slate-900/50 border-slate-700 text-slate-100 focus:ring-blue-500">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700 text-slate-100">
                  <SelectItem value="Bug Report">Bug Report</SelectItem>
                  <SelectItem value="Suggestion">Suggestion</SelectItem>
                  <SelectItem value="Feature Request">Feature Request</SelectItem>
                  <SelectItem value="UI/UX Feedback">UI/UX Feedback</SelectItem>
                  <SelectItem value="Complaint">Complaint</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="subject" className="text-slate-300">Subject <span className="text-red-500">*</span></Label>
              <Input 
                id="subject"
                placeholder="Briefly describe your feedback" 
                value={formData.subject}
                onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                className="bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="message" className="text-slate-300">Message <span className="text-red-500">*</span></Label>
              <Textarea 
                id="message"
                placeholder="Provide detailed information..." 
                value={formData.message}
                onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                className="min-h-[120px] bg-slate-900/50 border-slate-700 text-slate-100 placeholder:text-slate-500 focus-visible:ring-blue-500 resize-none"
                required
              />
            </div>

            <div className="space-y-2 pt-2">
              <Label className="text-slate-300">Screenshot (Optional)</Label>
              <div 
                className={`border-2 border-dashed rounded-xl p-4 transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer ${file ? 'border-blue-500/50 bg-blue-500/5' : 'border-slate-700 hover:border-slate-600 bg-slate-900/30'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/*" 
                  className="hidden" 
                />
                
                {file ? (
                  <div className="flex items-center gap-3 w-full max-w-sm bg-slate-800/80 p-2 rounded-lg border border-slate-700">
                    <div className="h-10 w-10 shrink-0 bg-slate-900 rounded flex items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-200 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-400/10 z-10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                      <Upload className="h-5 w-5 text-slate-400" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-slate-300 font-medium">Click to upload an image</p>
                      <p className="text-xs text-slate-500 mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="pt-4 flex gap-3">
              <Button type="button" variant="outline" className="flex-1 bg-transparent border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading} className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
