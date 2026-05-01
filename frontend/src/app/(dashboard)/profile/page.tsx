'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { uploadIdCard } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { toast } from 'sonner';
import {
  Loader2, ShieldCheck, ShieldAlert, Clock, User, Mail,
  BadgeCheck, Upload, CheckCircle2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, dbUser, loading, isVerified, hasPendingVerification } = useAuth();
  const router = useRouter();

  const [prn, setPrn] = useState('');
  const [phone, setPhone] = useState('');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  const isUnsubmitted = dbUser?.prn?.startsWith('PENDING-');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prn || !phone || !idCardFile) {
      toast.error('Please fill all fields and upload your ID card.');
      return;
    }

    setIsSubmitting(true);
    try {
      const idCardUrl = await uploadIdCard(idCardFile, user.id);

      const { error } = await supabase
        .from('users')
        .update({
          prn,
          phone,
          id_card_url: idCardUrl,
          status: 'pending',
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Verification submitted! An admin will review your ID card shortly.');
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to submit verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Verification status badge ───────────────────────────────────────────────
  const StatusBadge = () => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="h-4 w-4" /> Verified Student
        </span>
      );
    }
    if (hasPendingVerification) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Clock className="h-4 w-4" /> Verification Pending Review
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
        <ShieldAlert className="h-4 w-4" /> Unverified
      </span>
    );
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ─── Profile Card ─────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-blue-500 to-indigo-600" />
        <CardContent className="pt-0 -mt-12 pb-6">
          <div className="flex items-end gap-4 mb-4">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-3xl font-bold text-blue-600 shrink-0">
              {dbUser?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
            </div>
            <div className="pb-1">
              <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                {dbUser?.full_name || 'Student'}
              </h1>
              <StatusBadge />
            </div>
          </div>

          <div className="grid gap-3 mt-4">
            <div className="flex items-center gap-3 text-sm text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              {user.email}
            </div>
            {!isUnsubmitted && dbUser?.prn && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <BadgeCheck className="h-4 w-4 text-slate-400" />
                PRN: {dbUser.prn}
              </div>
            )}
            {dbUser?.phone && (
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <User className="h-4 w-4 text-slate-400" />
                {dbUser.phone}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ─── Permissions Card ─────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Your Access Level</CardTitle>
          <CardDescription>What you can do on AFIN right now.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: 'Browse notes, PYQs, assignments', allowed: true },
            { label: 'Download content', allowed: true },
            { label: 'View student requests', allowed: true },
            { label: 'Upload content', allowed: isVerified },
            { label: 'Make requests', allowed: isVerified },
          ].map(({ label, allowed }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <CheckCircle2
                className={`h-4 w-4 shrink-0 ${allowed ? 'text-emerald-500' : 'text-slate-300'}`}
              />
              <span className={allowed ? 'text-slate-700' : 'text-slate-400'}>{label}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* ─── Verification Form (only for unsubmitted users) ───────────────────── */}
      {isUnsubmitted && (
        <Card className="rounded-2xl border-0 shadow-sm border-t-4 border-t-amber-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-amber-500" />
              Get Verified
            </CardTitle>
            <CardDescription>
              Submit your PRN and university ID card. Once an admin approves, you'll be able to
              upload and make requests.
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
                  className="rounded-xl h-11"
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
                  className="rounded-xl h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="idcard">University ID Card (Image or PDF)</Label>
                <Input
                  id="idcard"
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setIdCardFile(e.target.files?.[0] || null)}
                  required
                  className="rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <p className="text-xs text-slate-500">Max size: 10 MB.</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-medium"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Submit for Verification
              </Button>
            </CardFooter>
          </form>
        </Card>
      )}

      {/* ─── Pending state card ──────────────────────────────────────────────── */}
      {hasPendingVerification && (
        <Card className="rounded-2xl border-0 shadow-sm bg-blue-50 border border-blue-100">
          <CardContent className="flex items-center gap-4 py-5">
            <Clock className="h-10 w-10 text-blue-400 shrink-0" />
            <div>
              <p className="font-semibold text-blue-900">Verification under review</p>
              <p className="text-sm text-blue-700 mt-0.5">
                Your ID card has been received. An admin will approve your account soon. You'll
                automatically get full access once verified.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
