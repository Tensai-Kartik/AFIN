'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { uploadIdCard } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

export default function CompleteProfilePage() {
  const { user, dbUser, loading } = useAuth();
  const router = useRouter();

  const [prn, setPrn] = useState('');
  const [phone, setPhone] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
    if (dbUser && !dbUser.prn.startsWith('PENDING-')) {
      // Profile already completed
      router.push('/');
    }
  }, [user, dbUser, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prn || !phone || !idCardFile) {
      toast.error('Please fill all fields and upload your ID card.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Upload ID Card
      const idCardUrl = await uploadIdCard(idCardFile, user!.id);

      // 2. Update User Profile
      const { error } = await supabase
        .from('users')
        .update({
          prn,
          phone,
          id_card_url: idCardUrl,
          status: 'pending', // Awaiting admin verification
        })
        .eq('id', user!.id);

      if (error) throw error;

      toast.success('Profile submitted! Awaiting admin verification.');
      
      // Force reload to update auth context
      window.location.href = '/';
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to complete profile.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-blue-500" /></div>;

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <Card className="w-full max-w-lg shadow-lg border-0 rounded-2xl">
        <CardHeader className="space-y-2 text-center pb-6">
          <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">
            Complete Your Profile
          </CardTitle>
          <CardDescription className="text-base text-slate-500">
            Please provide your details and university ID to get verified.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="prn">PRN (Permanent Registration Number)</Label>
              <Input
                id="prn"
                placeholder="e.g. 2021000123"
                value={prn}
                onChange={(e) => setPrn(e.target.value)}
                required
                className="rounded-xl h-12"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="e.g. +91 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="rounded-xl h-12"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="idcard">ID Card Upload (Image or PDF)</Label>
              <Input
                id="idcard"
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                required
                className="rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <p className="text-xs text-slate-500 mt-1">Max size: 10MB.</p>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-xl h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Submit for Verification'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
