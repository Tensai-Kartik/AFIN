'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { uploadIdCard } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from 'sonner';
import {
  BadgeCheck, Upload, CheckCircle2, AlertCircle, Trophy, GraduationCap, Save,
  Mail, Loader2, Clock, User, ShieldCheck, ShieldAlert
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, dbUser, loading, isVerified, hasPendingVerification } = useAuth();
  const router = useRouter();

  const [fullName, setFullName] = useState(dbUser?.full_name || '');
  const [prn, setPrn] = useState(dbUser?.prn && !dbUser.prn.startsWith('PENDING-') ? dbUser.prn : '');
  const [phone, setPhone] = useState(dbUser?.phone || '');
  const [cgpa, setCgpa] = useState(dbUser?.cgpa || '');
  const [idCardFile, setIdCardFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUpdatingCgpa, setIsUpdatingCgpa] = useState(false);

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

  const isRejected = dbUser?.status === 'rejected';
  const isUnsubmitted = !dbUser?.prn || dbUser?.prn?.startsWith('PENDING-');
  const needsVerification = isUnsubmitted || isRejected;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !prn || !phone || !idCardFile) {
      toast.error('Please fill all fields and upload your ID card.');
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Upload ID Card
      const idCardUrl = await uploadIdCard(idCardFile, user.id);

      // 2. Get JWT Session to send to Express Backend
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error('Authentication session error. Please login again.');
      }
      const token = sessionData.session.access_token;

      // 3. Update via Express Backend API
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const response = await fetch(`${backendUrl}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          full_name: fullName,
          prn,
          phone,
          cgpa: cgpa ? parseFloat(cgpa as string) : null,
          id_card_url: idCardUrl,
          avatar_url: dbUser?.avatar_url || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update profile.');
      }

      toast.success('Verification submitted! An admin will review your ID card shortly.');
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to submit verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCgpa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cgpa) return;

    setIsUpdatingCgpa(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/profile/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          cgpa: cgpa ? parseFloat(cgpa as string) : null
        })
      });

      if (!res.ok) throw new Error('Failed to update CGPA');
      toast.success('CGPA updated successfully!');
      window.location.reload();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsUpdatingCgpa(false);
    }
  };

  // ─── Verification status badge ───────────────────────────────────────────────
  const StatusBadge = () => {
    if (isVerified) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="h-4 w-4" /> Verified
        </span>
      );
    }
    if (isRejected) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-red-50 text-red-700 border border-red-200">
          <ShieldAlert className="h-4 w-4" /> Rejected
        </span>
      );
    }
    if (hasPendingVerification) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="h-4 w-4" /> Pending
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold bg-slate-100 text-slate-700 border border-slate-200">
        <User className="h-4 w-4" /> Unverified
      </span>
    );
  };

  return (
    <div className="h-full lg:overflow-hidden lg:max-h-[calc(100vh-100px)] py-2">
      <div className="max-w-2xl mx-auto space-y-4">
      
      {!isVerified && !hasPendingVerification && (
        <Alert className="bg-amber-50 border-amber-200 text-amber-900 rounded-2xl">
          <AlertCircle className="h-5 w-5 text-amber-600" />
          <AlertTitle className="font-semibold text-amber-800">Your account is not verified.</AlertTitle>
          <AlertDescription className="text-amber-700 mt-1">
            You can view content but cannot contribute until you complete verification below.
          </AlertDescription>
        </Alert>
      )}

      {/* ─── Profile Card ─────────────────────────────────────────────────────── */}
      <Card className="rounded-2xl border-0 shadow-sm overflow-hidden">
        <div className="relative h-28 bg-gradient-to-br from-blue-500 to-indigo-600 px-6 pb-3 flex items-end gap-4">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-lg flex items-center justify-center text-3xl font-bold text-blue-600 shrink-0 translate-y-8 border-4 border-white">
            {dbUser?.full_name?.charAt(0) || user.email?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1 flex justify-between items-end pb-1 text-white">
            <div>
              <h1 className="text-2xl font-bold leading-tight drop-shadow-sm">
                {dbUser?.full_name || 'Student'}
              </h1>
              <div className="mt-1">
                <StatusBadge />
              </div>
            </div>
            <div className="text-right">
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-sm">
                <Trophy className="h-4 w-4" />
                <span className="text-lg font-bold">{dbUser?.points || 0}</span>
                <span className="text-xs font-medium uppercase tracking-wider opacity-80">pts</span>
              </div>
            </div>
          </div>
        </div>
        <CardContent className="pt-10 pb-4">
          <div className="grid gap-2 mt-1">
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

      {/* ─── Academic Info Card ───────────────────────────────────────────── */}
      <Card className="rounded-2xl border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-blue-600" />
            Academic Details
          </CardTitle>
          <CardDescription>Keep your academic record up to date for placements.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdateCgpa} className="flex items-end gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="current-cgpa">Current CGPA</Label>
              <Input
                id="current-cgpa"
                type="number"
                step="0.01"
                min="0"
                max="10"
                placeholder="e.g. 8.5"
                value={cgpa}
                onChange={(e) => setCgpa(e.target.value)}
                className="rounded-xl h-11"
              />
            </div>
            <Button 
              type="submit" 
              disabled={isUpdatingCgpa || !cgpa} 
              className="rounded-xl h-11 bg-slate-900 hover:bg-slate-800 text-white gap-2"
            >
              {isUpdatingCgpa ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Update
            </Button>
          </form>
          <p className="text-xs text-slate-400 mt-2">
            Your CGPA is used to match you with eligible companies in the Placement Tracker.
          </p>
        </CardContent>
      </Card>

      {/* ─── Verification Form (only for unsubmitted/rejected users) ───────────────────── */}
      {needsVerification && (
        <Card className="rounded-2xl border-0 shadow-sm border-t-4 border-t-blue-500" id="verify-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="h-5 w-5 text-blue-500" />
              {isRejected ? 'Resubmit Verification' : 'Complete Verification'}
            </CardTitle>
            <CardDescription>
              {isRejected 
                ? 'Your previous verification was rejected. Please check your details and submit a clear ID card.' 
                : 'Submit your details and university ID card. Once an admin approves, you will be able to contribute.'}
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="e.g. John Doe"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="rounded-xl h-11"
                />
              </div>

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

              <div className="grid grid-cols-2 gap-4">
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
                  <Label htmlFor="form-cgpa">Current CGPA</Label>
                  <Input
                    id="form-cgpa"
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    placeholder="e.g. 8.5"
                    value={cgpa}
                    onChange={(e) => setCgpa(e.target.value)}
                    required
                    className="rounded-xl h-11"
                  />
                </div>
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
        <Card className="rounded-2xl border-0 shadow-sm bg-amber-50 border border-amber-100">
          <CardContent className="flex items-center gap-4 py-5">
            <Clock className="h-10 w-10 text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-amber-900">Verification under review</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Your ID card has been received. An admin will approve your account soon. You'll
                automatically get full access once verified.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  </div>
);
}
