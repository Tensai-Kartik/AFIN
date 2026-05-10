'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Check, X, Search, FileText, Users, FileCheck, ExternalLink, Calendar, BookOpen, Bell, Pin, MessageSquare, Star, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';

type PendingUser = {
  id: string;
  full_name: string;
  prn: string;
  email: string;
  phone: string;
  avatar_url: string;
  id_card_url: string;
  created_at: string;
};

type PendingContent = {
  id: string;
  title: string;
  description: string;
  subject: string;
  semester: number;
  type: string;
  file_url: string;
  created_at: string;
  users: {
    full_name: string;
    prn: string;
  };
};

type PendingNotice = {
  id: string;
  title: string;
  description: string;
  category: string;
  is_important: boolean;
  created_at: string;
  users: {
    full_name: string;
    prn: string;
  };
};

type AdminFeedback = {
  id: string;
  rating: number;
  comment: string;
  subject: string;
  faculty_name: string;
  sentiment_score: number;
  created_at: string;
};

type AppFeedback = {
  id: string;
  user_name: string;
  user_email: string;
  feedback_type: string;
  subject: string;
  message: string;
  screenshot_url: string;
  status: string;
  created_at: string;
};

export default function AdminDashboardPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingContent, setPendingContent] = useState<PendingContent[]>([]);
  const [pendingNotices, setPendingNotices] = useState<PendingNotice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('users');
  const [feedbackData, setFeedbackData] = useState<{ feedback: AdminFeedback[], by_faculty: any[], avg_rating: number, total: number } | null>(null);
  const [appFeedbackData, setAppFeedbackData] = useState<{ feedback: AppFeedback[], total: number, bugs: number, features: number, suggestions: number } | null>(null);

  const fetchPendingUsers = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/pending-users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || `Error ${res.status}`);
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const data = await res.json();
      setPendingUsers(data.users || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load pending users.');
    }
  }, []);

  const fetchPendingContent = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/pending-content`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || `Error ${res.status}`);
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const data = await res.json();
      setPendingContent(data.content || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load pending content.');
    }
  }, []);

  const fetchPendingNotices = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/pending-notices`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || `Error ${res.status}`);
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const data = await res.json();
      setPendingNotices(data.notices || []);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load pending notices.');
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          throw new Error(data.error || `Error ${res.status}`);
        } catch {
          throw new Error(`Server returned ${res.status}: ${text.slice(0, 100)}`);
        }
      }

      const data = await res.json();
      setFeedbackData(data);
    } catch (error: any) {
      console.error(error);
      toast.error('Failed to load feedback.');
    }
  }, []);

  const fetchAppFeedback = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) return;

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/app-feedback`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!res.ok) throw new Error('Failed to fetch app feedback');
      const data = await res.json();
      setAppFeedbackData(data);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchPendingUsers(), fetchPendingContent(), fetchPendingNotices(), fetchFeedback(), fetchAppFeedback()]);
    setLoading(false);
  }, [fetchPendingUsers, fetchPendingContent, fetchPendingNotices, fetchFeedback, fetchAppFeedback]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleUserAction = async (targetUserId: string, action: 'approve' | 'reject') => {
    setActionLoading(targetUserId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('No session');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/verify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetUserId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setPendingUsers(prev => prev.filter(u => u.id !== targetUserId));
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to ${action} user.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleContentAction = async (targetContentId: string, action: 'approve' | 'reject') => {
    setActionLoading(targetContentId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('No session');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/verify-content`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetContentId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setPendingContent(prev => prev.filter(c => c.id !== targetContentId));
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to ${action} content.`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoticeAction = async (targetNoticeId: string, action: 'approve' | 'reject') => {
    setActionLoading(targetNoticeId);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('No session');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/admin/verify-notice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ targetNoticeId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message);
      setPendingNotices(prev => prev.filter(n => n.id !== targetNoticeId));
    } catch (error: any) {
      console.error(error);
      toast.error(`Failed to ${action} notice.`);
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleDeleteFeedback = async (id: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this feedback?")) return;
    
    setActionLoading(id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('No session');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/delete/faculty-feedback/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete');

      toast.success('Feedback deleted successfully.');
      await fetchFeedback(); 
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to delete feedback.');
    } finally {
      setActionLoading(null);
    }
  };
  
  const handleAppFeedbackStatus = async (id: string, status: 'pending' | 'reviewed' | 'planned' | 'resolved') => {
    setActionLoading(id);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error('No session');

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      
      if (status === 'resolved') {
        // Per user request: "like after pressing resolve the review should be deleted"
        if (!window.confirm("Resolve and delete this feedback? This is permanent.")) {
          setActionLoading(null);
          return;
        }
        const res = await fetch(`${backendUrl}/api/delete/app-feedback/${id}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to delete');
        toast.success('Feedback resolved and permanently deleted.');
      } else {
        // Regular status update
        const res = await fetch(`${backendUrl}/api/admin/app-feedback/${id}/status`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ status })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to update status');
        toast.success(`Status updated to ${status}.`);
      }

      await fetchAppFeedback(); 
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Action failed.');
    } finally {
      setActionLoading(null);
    }
  };

  const filteredUsers = pendingUsers.filter(u => 
    u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    u.prn?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredContent = pendingContent.filter(c => 
    c.title?.toLowerCase().includes(search.toLowerCase()) || 
    c.subject?.toLowerCase().includes(search.toLowerCase()) ||
    c.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredNotices = pendingNotices.filter(n => 
    n.title?.toLowerCase().includes(search.toLowerCase()) || 
    n.category?.toLowerCase().includes(search.toLowerCase()) ||
    n.users?.full_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Admin Dashboard</h2>
          <p className="text-slate-500 mt-1">Manage user verifications and content approvals.</p>
        </div>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input 
            placeholder="Search..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl border-slate-200 bg-white"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12 w-full sm:w-auto">
          <TabsTrigger value="users" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Users className="w-4 h-4 mr-2" />
            Users
            {pendingUsers.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                {pendingUsers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FileCheck className="w-4 h-4 mr-2" />
            Content
            {pendingContent.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                {pendingContent.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="notices" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-2" />
            Notices
            {pendingNotices.length > 0 && (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                {pendingNotices.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="feedback" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <MessageSquare className="w-4 h-4 mr-2" />
            Faculty Feedback
            {feedbackData?.total ? (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                {feedbackData.total}
              </Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="app-feedback" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Star className="w-4 h-4 mr-2" />
            App Feedback
            {appFeedbackData?.total ? (
              <Badge variant="secondary" className="ml-2 bg-blue-100 text-blue-700 hover:bg-blue-100 border-0">
                {appFeedbackData.total}
              </Badge>
            ) : null}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-6 focus-visible:outline-none">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Check className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">All Caught Up!</h3>
                <p className="text-slate-500 max-w-sm">There are no pending user verifications at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map(u => (
                <Card key={u.id} className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                    <div className="flex items-center gap-4">
                      {u.avatar_url ? (
                        <Image src={u.avatar_url} alt={u.full_name} width={48} height={48} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-lg shadow-sm border-2 border-white">
                          {u.full_name?.charAt(0) || u.email.charAt(0)}
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg text-slate-900 leading-tight">{u.full_name || 'No Name'}</CardTitle>
                        <CardDescription className="text-blue-600 font-medium mt-0.5">{u.prn}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-4">
                    <div className="space-y-1 text-sm">
                      <p className="flex justify-between"><span className="text-slate-500">Email:</span> <span className="font-medium text-slate-900 truncate ml-2" title={u.email}>{u.email}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500">Phone:</span> <span className="font-medium text-slate-900">{u.phone || 'N/A'}</span></p>
                      <p className="flex justify-between"><span className="text-slate-500">Applied:</span> <span className="font-medium text-slate-900">{new Date(u.created_at).toLocaleDateString()}</span></p>
                    </div>
                    
                    <a 
                      href={u.id_card_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors font-medium text-sm group"
                    >
                      <FileText className="w-4 h-4 mr-2 text-slate-500 group-hover:text-blue-600 transition-colors" />
                      View ID Card
                    </a>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11"
                        onClick={() => handleUserAction(u.id, 'reject')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" /> Reject</>}
                      </Button>
                      <Button 
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11"
                        onClick={() => handleUserAction(u.id, 'approve')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === u.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Approve</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="space-y-6 focus-visible:outline-none">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredContent.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <BookOpen className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Pending Content</h3>
                <p className="text-slate-500 max-w-sm">For content approval: No pending content uploads at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredContent.map(c => (
                <Card key={c.id} className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md">
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 mb-1 uppercase text-[10px] tracking-wider font-bold">
                          {c.type}
                        </Badge>
                        <CardTitle className="text-lg text-slate-900 leading-tight line-clamp-1">{c.title}</CardTitle>
                        <CardDescription className="flex items-center text-slate-500 text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(c.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-4">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Subject:</span>
                        <span className="font-medium text-slate-900">Sem {c.semester} • {c.subject}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Uploader:</span>
                        <span className="font-medium text-slate-900 truncate ml-2" title={c.users?.full_name}>
                          {c.users?.full_name} ({c.users?.prn})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 line-clamp-2 italic">
                      "{c.description || 'No description provided.'}"
                    </p>
                    
                    <a 
                      href={c.file_url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="flex items-center justify-center w-full py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-colors font-medium text-sm group"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Document
                    </a>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11"
                        onClick={() => handleContentAction(c.id, 'reject')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" /> Reject</>}
                      </Button>
                      <Button 
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11"
                        onClick={() => handleContentAction(c.id, 'approve')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Approve</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        <TabsContent value="notices" className="space-y-6 focus-visible:outline-none">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : filteredNotices.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <Bell className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Pending Notices</h3>
                <p className="text-slate-500 max-w-sm">For notice approval: No pending notices at the moment.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNotices.map(n => (
                <Card key={n.id} className={`border-0 shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md ${n.is_important ? 'ring-2 ring-red-100' : ''}`}>
                  <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 uppercase text-[10px] tracking-wider font-bold">
                            {n.category}
                          </Badge>
                          {n.is_important && (
                            <Badge className="bg-red-100 text-red-700 border-red-200 uppercase text-[10px] tracking-wider font-bold">
                              <Pin className="w-3 h-3 mr-1" /> Important
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-lg text-slate-900 leading-tight line-clamp-1">{n.title}</CardTitle>
                        <CardDescription className="flex items-center text-slate-500 text-xs">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(n.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-4 pb-5 space-y-4">
                    <div className="space-y-1.5 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Author:</span>
                        <span className="font-medium text-slate-900 truncate ml-2" title={n.users?.full_name}>
                          {n.users?.full_name} ({n.users?.prn})
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 line-clamp-4 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                      "{n.description}"
                    </p>

                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <Button 
                        variant="outline" 
                        className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 h-11"
                        onClick={() => handleNoticeAction(n.id, 'reject')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" /> Reject</>}
                      </Button>
                      <Button 
                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm h-11"
                        onClick={() => handleNoticeAction(n.id, 'approve')}
                        disabled={actionLoading !== null}
                      >
                        {actionLoading === n.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Approve</>}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-6 focus-visible:outline-none">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : !feedbackData || feedbackData.feedback.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No feedback submitted yet</h3>
                <p className="text-slate-500 max-w-sm">When users submit anonymous feedback, it will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Total Feedback</p>
                    <div className="flex items-center gap-2 mt-2">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                      <span className="text-3xl font-bold text-slate-900">{feedbackData.total}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Average Rating</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                      <span className="text-3xl font-bold text-slate-900">{feedbackData.avg_rating} / 10</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {feedbackData.by_faculty && feedbackData.by_faculty.length > 0 && (
                <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-lg">Average Rating per Faculty</CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="divide-y divide-slate-100">
                      {feedbackData.by_faculty.map((f) => (
                        <div key={f.faculty_name} className="flex justify-between items-center p-4 hover:bg-slate-50 transition-colors">
                          <span className="font-medium text-slate-900">{f.faculty_name}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500">{f.count} reviews</span>
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-0 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-blue-700" /> {f.avg_rating}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              <h3 className="text-xl font-bold text-slate-900 pt-4">Recent Feedback</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {feedbackData.feedback.filter(f => 
                  f.faculty_name?.toLowerCase().includes(search.toLowerCase()) || 
                  f.subject?.toLowerCase().includes(search.toLowerCase()) ||
                  f.comment?.toLowerCase().includes(search.toLowerCase())
                ).map(f => (
                  <Card key={f.id} className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden transition-all hover:shadow-md">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              {f.subject}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {new Date(f.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex justify-between items-start w-full pt-1 gap-2">
                            <CardTitle className="text-lg text-slate-900">{f.faculty_name}</CardTitle>
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md shrink-0"
                              onClick={() => handleDeleteFeedback(f.id)}
                              disabled={actionLoading === f.id}
                            >
                              {actionLoading === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">Rating:</span>
                        <div className="flex items-center text-amber-500 font-bold gap-1">
                          <Star className="w-4 h-4 fill-amber-500" /> {f.rating}/10
                        </div>
                      </div>
                      {f.comment && (
                        <p className="text-sm text-slate-600 line-clamp-4 bg-slate-50 p-3 rounded-lg border border-slate-100 italic">
                          "{f.comment}"
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="app-feedback" className="space-y-6 focus-visible:outline-none">
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : !appFeedbackData || appFeedbackData.feedback.length === 0 ? (
            <Card className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden">
              <CardContent className="py-16 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
                  <MessageSquare className="w-8 h-8 text-blue-500" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No App Feedback</h3>
                <p className="text-slate-500 max-w-sm">No users have submitted app feedback yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Total Feedback</p>
                    <div className="flex items-center gap-2 mt-2">
                      <MessageSquare className="w-6 h-6 text-blue-600" />
                      <span className="text-3xl font-bold text-slate-900">{appFeedbackData.total}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Bug Reports</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-3xl font-bold text-red-600">{appFeedbackData.bugs}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Feature Requests</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-3xl font-bold text-purple-600">{appFeedbackData.features}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-0 shadow-sm rounded-2xl bg-white">
                  <CardContent className="p-6">
                    <p className="text-sm font-medium text-slate-500">Suggestions</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-3xl font-bold text-green-600">{appFeedbackData.suggestions}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {appFeedbackData.feedback.filter(f => 
                  f.subject?.toLowerCase().includes(search.toLowerCase()) || 
                  f.user_name?.toLowerCase().includes(search.toLowerCase()) ||
                  f.message?.toLowerCase().includes(search.toLowerCase())
                ).map(f => (
                  <Card key={f.id} className="border-0 shadow-sm rounded-2xl bg-white overflow-hidden flex flex-col h-full">
                    <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="space-y-1 w-full">
                          <div className="flex justify-between items-center w-full">
                            <Badge variant="outline" className={`
                              ${f.feedback_type === 'Bug Report' ? 'bg-red-50 text-red-700 border-red-200' : 
                                f.feedback_type === 'Feature Request' ? 'bg-purple-50 text-purple-700 border-purple-200' : 
                                f.feedback_type === 'Suggestion' ? 'bg-green-50 text-green-700 border-green-200' : 
                                'bg-blue-50 text-blue-700 border-blue-200'}`}>
                              {f.feedback_type}
                            </Badge>
                            <span className="text-xs text-slate-400">
                              {new Date(f.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <CardTitle className="text-lg text-slate-900 pt-1 line-clamp-2">{f.subject}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 pb-5 space-y-4 flex-1 flex flex-col">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-500">From:</span>
                        <span className="font-medium text-slate-900">{f.user_name || f.user_email || 'Unknown'}</span>
                      </div>
                      
                      <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 italic flex-1 overflow-y-auto max-h-32">
                        "{f.message}"
                      </p>

                      {f.screenshot_url && (
                        <a href={f.screenshot_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                          <ExternalLink className="w-3 h-3" /> View Screenshot
                        </a>
                      )}

                      <div className="pt-2 border-t border-slate-100 mt-2">
                        <p className="text-xs text-slate-500 mb-2">Status: <span className="font-semibold text-slate-700 capitalize">{f.status}</span></p>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-8 flex-1" 
                            onClick={() => handleAppFeedbackStatus(f.id, 'reviewed')} 
                            disabled={actionLoading !== null || f.status === 'reviewed'}
                          >
                            {actionLoading === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Reviewed'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-8 flex-1 border-blue-200 text-blue-700 hover:bg-blue-50" 
                            onClick={() => handleAppFeedbackStatus(f.id, 'planned')} 
                            disabled={actionLoading !== null || f.status === 'planned'}
                          >
                            {actionLoading === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Planned'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="text-xs h-8 flex-1 border-green-200 text-green-700 hover:bg-green-50" 
                            onClick={() => handleAppFeedbackStatus(f.id, 'resolved')} 
                            disabled={actionLoading !== null}
                          >
                            {actionLoading === f.id ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Resolved'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
