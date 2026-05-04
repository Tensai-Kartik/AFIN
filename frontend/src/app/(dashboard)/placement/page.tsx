'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Briefcase, CheckCircle, Clock, XCircle, Trophy, Loader2, Calendar, Zap, Star, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/components/auth-provider';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  applied: { label: 'Applied', color: 'bg-blue-100 text-blue-700', icon: Clock },
  shortlisted: { label: 'Shortlisted', color: 'bg-amber-100 text-amber-700', icon: Star },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  selected: { label: 'Selected! 🎉', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export default function PlacementPage() {
  const { dbUser } = useAuth();
  const [companies, setCompanies] = useState<any[]>([]);
  const [myApplications, setMyApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchData = async () => {
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {};

      const [companiesRes, appRes] = await Promise.all([
        fetch(`${backendUrl}/api/placement/companies`),
        token ? fetch(`${backendUrl}/api/placement/my-applications`, { headers }) : Promise.resolve(null)
      ]);

      const companiesData = await companiesRes.json();
      setCompanies(companiesData.companies || []);

      if (appRes) {
        const appData = await appRes.json();
        setMyApplications(appData.applications || []);
      }
    } catch (error) {
      console.error('Error loading placement data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const apply = async (companyId: string) => {
    setApplying(companyId);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) { toast.error('Please log in to apply.'); return; }

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/placement/apply`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Application submitted!');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to apply.');
    } finally {
      setApplying(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      if (!token) throw new Error('Not logged in');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/delete/placement/${deleteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Company listing deleted');
      setCompanies(prev => prev.filter(c => c.id !== deleteId));
      setDeleteId(null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const appliedIds = new Set(myApplications.map(a => a.company_id));
  const userCgpa = dbUser?.cgpa || 0;

  const isEligible = (company: any) => userCgpa === 0 || company.min_cgpa === 0 || userCgpa >= company.min_cgpa;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Briefcase className="h-8 w-8 text-blue-600" /> Placement Tracker
        </h1>
        <p className="text-slate-500 mt-1">Companies visiting campus, eligibility checks, and your application status.</p>
      </div>

      {dbUser && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
          <div className="p-3 bg-blue-600 rounded-xl">
            <Trophy className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-slate-900">{dbUser.full_name}</p>
            <p className="text-sm text-slate-500">CGPA: <strong className="text-blue-700">{userCgpa > 0 ? userCgpa : 'Not set — update in profile'}</strong></p>
          </div>
          {userCgpa === 0 && (
            <a href="/profile" className="ml-auto text-xs text-blue-600 underline font-medium">Set CGPA →</a>
          )}
        </div>
      )}

      <Tabs defaultValue="companies" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
          <TabsTrigger value="companies" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Briefcase className="w-4 h-4 mr-2" /> Companies
          </TabsTrigger>
          <TabsTrigger value="applications" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CheckCircle className="w-4 h-4 mr-2" /> My Applications
            {myApplications.length > 0 && (
              <Badge className="ml-2 bg-blue-600 text-white text-[10px] px-1.5">{myApplications.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="companies" className="space-y-4">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            : companies.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No company listings yet. Check back soon!</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {companies.map(company => {
                  const eligible = isEligible(company);
                  const applied = appliedIds.has(company.id);
                  return (
                    <Card key={company.id} className={`rounded-2xl border-0 shadow-sm hover:shadow-md transition-all duration-300 ${!eligible ? 'opacity-60' : ''}`}>
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">{company.name}</CardTitle>
                            <CardDescription className="mt-0.5">{company.description}</CardDescription>
                          </div>
                          {company.package_lpa && (
                            <Badge className="bg-green-50 text-green-700 border-green-200 shrink-0">
                              ₹{company.package_lpa} LPA
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex flex-wrap gap-2 text-xs">
                          <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium text-slate-700">
                            <Zap className="w-3 h-3" /> Min CGPA: {company.min_cgpa || 'None'}
                          </span>
                          {company.visit_date && (
                            <span className="flex items-center gap-1 bg-slate-100 px-2.5 py-1 rounded-full font-medium text-slate-700">
                              <Calendar className="w-3 h-3" /> {format(new Date(company.visit_date), 'MMM d, yyyy')}
                            </span>
                          )}
                        </div>
                        {company.required_skills?.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {company.required_skills.map((s: string) => (
                              <Badge key={s} variant="outline" className="text-[11px] rounded-full">{s}</Badge>
                            ))}
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            className={`flex-1 rounded-xl h-10 ${applied ? 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200' : eligible ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                            disabled={!eligible || applied || applying === company.id}
                            onClick={() => !applied && eligible && apply(company.id)}
                          >
                            {applying === company.id ? <Loader2 className="h-4 w-4 animate-spin" />
                              : applied ? <><CheckCircle className="mr-2 h-4 w-4" /> Applied</>
                              : !eligible ? 'Not Eligible (CGPA too low)'
                              : 'Apply Now'}
                          </Button>
                          {(dbUser?.role === 'admin' || company.created_by === dbUser?.id) && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 h-10 w-10 shrink-0 border border-slate-100"
                              onClick={() => setDeleteId(company.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4">
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            : myApplications.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <CheckCircle className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">You haven't applied to any companies yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myApplications.map(app => {
                  const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.applied;
                  const Icon = cfg.icon;
                  return (
                    <Card key={app.id} className="rounded-2xl border-0 shadow-sm">
                      <CardContent className="pt-4 pb-4 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-xl">
                          <Briefcase className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-slate-900">{app.companies?.name}</p>
                          <p className="text-xs text-slate-500">
                            Applied {format(new Date(app.created_at), 'MMM d, yyyy')}
                            {app.companies?.package_lpa && ` • ₹${app.companies.package_lpa} LPA`}
                          </p>
                        </div>
                        <Badge className={`${cfg.color} flex items-center gap-1.5 shrink-0`}>
                          <Icon className="w-3 h-3" /> {cfg.label}
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
        </TabsContent>
      </Tabs>

      <DeleteConfirmModal 
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
