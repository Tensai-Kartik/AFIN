'use client';

import { useAuth } from '@/components/auth-provider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, FileText, ClipboardList, Briefcase, Globe, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { AnalyticsTwin } from '@/components/dashboard/analytics-twin';
import { Recommendations } from '@/components/dashboard/recommendations';

export default function Dashboard() {
  const { dbUser } = useAuth();

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">
            Welcome back, {dbUser?.full_name?.split(' ')[0] || 'Student'}! Here's what's new.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Notes', icon: BookOpen, href: '/notes', color: 'text-blue-600', bg: 'bg-blue-50', desc: 'Browse Study Materials' },
          { title: 'PYQs', icon: FileText, href: '/pyqs', color: 'text-indigo-600', bg: 'bg-indigo-50', desc: 'Past Exam Papers' },
          { title: 'Assignments', icon: ClipboardList, href: '/assignments', color: 'text-purple-600', bg: 'bg-purple-50', desc: 'Reference Solutions' },
        ].map((item, i) => (
          <Link key={i} href={item.href}>
            <Card className="group hover:shadow-md transition-all duration-300 cursor-pointer rounded-2xl border-0 shadow-sm overflow-hidden bg-white">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`p-3 ${item.bg} rounded-2xl group-hover:scale-110 transition-transform`}>
                  <item.icon className={`h-6 w-6 ${item.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Analytics / Digital Twin Section */}
          <AnalyticsTwin />
          
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-2xl border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Recent Notices</CardTitle>
                <CardDescription>Updates from administration.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400 text-center py-10 italic">
                  No new notifications.
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-2xl border-0 shadow-sm bg-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Open Requests</CardTitle>
                <CardDescription>Help fellow students.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-400 text-center py-10 italic">
                  All requests answered.
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          {/* Recommendations Sidebar */}
          <Recommendations />
          
          {/* Marketplace Shortcut */}
          <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative group transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6 relative z-10">
              <div className="p-3 bg-blue-50 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Globe className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Global Marketplace</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Trade skills, offer tutoring, or buy/sell project components.
              </p>
              <Link href="/market">
                <div className="w-full py-2.5 bg-blue-600 text-white rounded-xl font-bold text-sm text-center hover:bg-blue-700 transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2">
                  Browse Skills <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            </CardContent>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-blue-50 rounded-full blur-2xl group-hover:scale-150 transition-transform opacity-50" />
          </Card>

          {/* Placements Shortcut */}
          <Card className="rounded-2xl border-0 shadow-sm bg-white overflow-hidden relative group transition-all duration-300 hover:shadow-md">
            <CardContent className="p-6 relative z-10">
              <div className="p-3 bg-indigo-50 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Briefcase className="h-6 w-6 text-indigo-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">Placements</h3>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Track opportunities, eligibility, and applications.
              </p>
              <Link href="/placement">
                <div className="w-full py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm text-center hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg cursor-pointer flex items-center justify-center gap-2">
                  Explore Placements <ChevronRight className="h-4 w-4" />
                </div>
              </Link>
            </CardContent>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:scale-150 transition-transform opacity-50" />
          </Card>
        </div>
      </div>
    </div>
  );
}
