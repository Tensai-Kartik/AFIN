'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { MessageSquarePlus, Star, Send, Loader2, ShieldCheck, Info, Lock } from 'lucide-react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';

export default function FeedbackPage() {
  const { dbUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [facultyName, setFacultyName] = useState('');
  const [subject, setSubject] = useState('');
  const [comment, setComment] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) { toast.error('Please select a rating.'); return; }
    if (!facultyName || !subject) { toast.error('Please fill all required fields.'); return; }

    setIsSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/feedback/create`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ rating, faculty_name: facultyName, subject, comment })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSubmitted(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getRatingLabel = (r: number) => {
    if (r <= 2) return 'Poor';
    if (r <= 4) return 'Below Average';
    if (r <= 6) return 'Average';
    if (r <= 8) return 'Good';
    return 'Excellent';
  };

  const getRatingColor = (r: number) => {
    if (r <= 3) return 'text-red-500';
    if (r <= 6) return 'text-amber-500';
    return 'text-green-500';
  };

  if (submitted) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="rounded-2xl border-0 shadow-sm text-center py-8">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center">
              <ShieldCheck className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900">Thank You!</h2>
            <p className="text-slate-500 max-w-xs">Your anonymous feedback has been recorded. Your identity is never stored.</p>
            <Button onClick={() => { setSubmitted(false); setRating(0); setFacultyName(''); setSubject(''); setComment(''); }}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white mt-2">
              Submit Another
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (dbUser?.role === 'admin') {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <MessageSquarePlus className="h-8 w-8 text-blue-600" />
            Faculty Feedback
          </h1>
          <p className="text-slate-500 mt-1">Feedback submission is restricted to students.</p>
        </div>
        
        <Card className="rounded-2xl border-0 shadow-sm text-center py-12 bg-slate-50">
          <CardContent className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center">
              <Lock className="w-8 h-8 text-slate-500" />
            </div>
            <h2 className="text-xl font-bold text-slate-900">Admin View-Only Mode</h2>
            <p className="text-slate-500 max-w-sm">
              Administrators cannot submit feedback to preserve the integrity of the anonymous feedback system.
              Please use the Admin Dashboard to view aggregated insights and feedback lists.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <MessageSquarePlus className="h-8 w-8 text-blue-600" />
          Faculty Feedback
        </h1>
        <p className="text-slate-500 mt-1">Share your experience. All feedback is completely anonymous.</p>
      </div>

      <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
        <Info className="w-4 h-4 shrink-0" />
        <span>Your identity is <strong>never stored</strong> with this feedback. Be honest and constructive.</span>
      </div>

      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader className="border-b border-slate-50">
          <CardTitle>Submit Feedback</CardTitle>
          <CardDescription>Rate your faculty and share your experience.</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="space-y-3">
              <Label>Rating *</Label>
              <div className="flex items-center gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((star) => (
                  <button key={star} type="button"
                    className={`text-2xl transition-transform hover:scale-110 ${(hoveredRating || rating) >= star ? 'text-yellow-400' : 'text-slate-200'}`}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    onClick={() => setRating(star)}
                  >★</button>
                ))}
              </div>
              {(hoveredRating || rating) > 0 && (
                <p className={`text-sm font-semibold ${getRatingColor(hoveredRating || rating)}`}>
                  {hoveredRating || rating}/10 — {getRatingLabel(hoveredRating || rating)}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="faculty">Faculty Name *</Label>
                <Input id="faculty" value={facultyName} onChange={e => setFacultyName(e.target.value)}
                  placeholder="e.g. Dr. Sharma" className="rounded-xl" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input id="subject" value={subject} onChange={e => setSubject(e.target.value)}
                  placeholder="e.g. Operating Systems" className="rounded-xl" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="comment">Comments (Optional)</Label>
              <Textarea id="comment" value={comment} onChange={e => setComment(e.target.value)}
                placeholder="Share what was great or how they can improve..." className="rounded-xl resize-none h-28" />
            </div>

            <Button type="submit" disabled={isSubmitting} className="w-full rounded-xl bg-blue-600 hover:bg-blue-700 text-white h-11">
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Submit Anonymously
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
