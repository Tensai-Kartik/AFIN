'use client';

import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, ClipboardList } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const { dbUser } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
        <p className="text-slate-500 mt-2">
          Welcome back, {dbUser?.full_name?.split(' ')[0] || 'Student'}! Here's what's new.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Link href="/notes">
          <Card className="hover:shadow-md transition-shadow cursor-pointer rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Notes</CardTitle>
              <BookOpen className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Browse Notes</div>
              <p className="text-xs text-slate-500 mt-1">Access study materials</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/pyqs">
          <Card className="hover:shadow-md transition-shadow cursor-pointer rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">PYQs</CardTitle>
              <FileText className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Past Papers</div>
              <p className="text-xs text-slate-500 mt-1">Previous year questions</p>
            </CardContent>
          </Card>
        </Link>
        <Link href="/assignments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer rounded-2xl border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Assignments</CardTitle>
              <ClipboardList className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">Solutions</div>
              <p className="text-xs text-slate-500 mt-1">Reference assignments</p>
            </CardContent>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Notices</CardTitle>
            <CardDescription>Important updates from the administration.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500 text-center py-8">
              No recent notices.
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Help out your fellow students.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-slate-500 text-center py-8">
              No recent requests.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
