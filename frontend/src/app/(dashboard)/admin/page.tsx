'use client';

import { useState, useEffect } from 'react';
import { useAuth, SOLE_ADMIN_EMAIL } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Eye, Shield, UserPlus, UserMinus, Bell } from 'lucide-react';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

export default function AdminPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'users';
  const { dbUser, isSoleAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    setActiveTab(searchParams.get('tab') || 'users');
  }, [searchParams]);
  const [users, setUsers] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminSearch, setAdminSearch] = useState('');
  const [foundUsers, setFoundUsers] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (dbUser?.role === 'admin') {
      fetchAdminData();
    }
  }, [dbUser]);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      // Fetch pending users
      const { data: usersData } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setUsers(usersData || []);

      // Fetch pending content
      const { data: contentData } = await supabase
        .from('content')
        .select(`*, users(full_name, prn)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setContent(contentData || []);

      // Fetch pending notices
      const { data: noticesData } = await supabase
        .from('notices')
        .select(`*, users!notices_author_id_fkey(full_name, prn)`)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setNotices(noticesData || []);

      // Fetch all admins
      const { data: adminsData } = await supabase
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .order('full_name', { ascending: true });

      setAdmins(adminsData || []);

    } catch (error) {
      console.error('Error fetching admin data:', error);
      toast.error('Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const handleUserAction = async (userId: string, status: 'verified' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ status, role: status === 'verified' ? 'verified_student' : 'user' })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success(`User ${status} successfully.`);
      setUsers(users.filter(u => u.id !== userId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleContentAction = async (contentId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('content')
        .update({ status, is_verified: status === 'approved' })
        .eq('id', contentId);
      
      if (error) throw error;
      toast.success(`Content ${status} successfully.`);
      setContent(content.filter(c => c.id !== contentId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleNoticeAction = async (noticeId: string, status: 'approved' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('notices')
        .update({ status })
        .eq('id', noticeId);
      
      if (error) throw error;
      toast.success(`Notice ${status} successfully.`);
      setNotices(notices.filter(n => n.id !== noticeId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const searchUsers = async () => {
    if (!adminSearch.trim()) return;
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .or(`full_name.ilike.%${adminSearch}%,prn.ilike.%${adminSearch}%`)
        .neq('role', 'admin')
        .limit(5);

      if (error) throw error;
      setFoundUsers(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSearching(false);
    }
  };

  const addAdmin = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'admin' })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success('Admin added successfully.');
      setFoundUsers(foundUsers.filter(u => u.id !== userId));
      fetchAdminData();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const removeAdmin = async (userId: string, email: string) => {
    if (email === SOLE_ADMIN_EMAIL) {
      toast.error('Cannot remove the sole admin.');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .update({ role: 'verified_student' })
        .eq('id', userId);
      
      if (error) throw error;
      toast.success('Admin removed successfully.');
      setAdmins(admins.filter(a => a.id !== userId));
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (dbUser?.role !== 'admin') {
    return <div className="text-center py-20 text-red-500 font-bold text-xl">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <Shield className="h-8 w-8 text-blue-600" />
            Admin Dashboard
          </h1>
          <p className="text-slate-500 mt-1">Manage system verifications, content, and team.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[600px] bg-slate-100 rounded-xl p-1">
          <TabsTrigger value="users" className="rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Verifications</TabsTrigger>
          <TabsTrigger value="content" className="rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Content</TabsTrigger>
          <TabsTrigger value="notices" className="rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Notices</TabsTrigger>
          <TabsTrigger value="admins" className="rounded-lg text-slate-600 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-sm">Admins</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
          ) : users.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="py-20 text-center text-slate-500">No pending user verifications.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {users.map(user => (
                <Card key={user.id} className="rounded-2xl shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="text-lg">{user.full_name}</CardTitle>
                    <CardDescription>PRN: {user.prn} • Phone: {user.phone}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" className="w-full rounded-xl" asChild>
                      <a href={user.id_card_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" /> View ID Card
                      </a>
                    </Button>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button onClick={() => handleUserAction(user.id, 'rejected')} variant="destructive" className="flex-1 rounded-xl">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => handleUserAction(user.id, 'verified')} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Verify
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="content" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
          ) : content.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="py-20 text-center text-slate-500">No pending content approvals.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {content.map(item => (
                <Card key={item.id} className="rounded-2xl shadow-sm border-0">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg line-clamp-1">{item.title}</CardTitle>
                      <Badge variant="secondary" className="capitalize">{item.type}</Badge>
                    </div>
                    <CardDescription>Sem {item.semester} • {item.subject}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-slate-600 line-clamp-2">{item.description}</p>
                    <div className="text-xs text-slate-500">
                      Uploaded by: {item.users?.full_name} ({item.users?.prn})
                    </div>
                    <Button variant="outline" className="w-full rounded-xl" asChild>
                      <a href={item.file_url} target="_blank" rel="noopener noreferrer">
                        <Eye className="mr-2 h-4 w-4" /> View File
                      </a>
                    </Button>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button onClick={() => handleContentAction(item.id, 'rejected')} variant="destructive" className="flex-1 rounded-xl">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => handleContentAction(item.id, 'approved')} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="notices" className="mt-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-500" /></div>
          ) : notices.length === 0 ? (
            <Card className="border-dashed border-2 bg-slate-50/50">
              <CardContent className="py-20 text-center text-slate-500">No pending notices to approve.</CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {notices.map(notice => (
                <Card key={notice.id} className="rounded-2xl shadow-sm border-0">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{notice.title}</CardTitle>
                      <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-0">{notice.category}</Badge>
                    </div>
                    <CardDescription>{format(new Date(notice.created_at), 'PPP')}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-slate-600">{notice.description}</p>
                    <div className="mt-4 text-xs text-slate-500">
                      By: {notice.users?.full_name}
                    </div>
                  </CardContent>
                  <CardFooter className="gap-2">
                    <Button onClick={() => handleNoticeAction(notice.id, 'rejected')} variant="destructive" className="flex-1 rounded-xl">
                      <XCircle className="mr-2 h-4 w-4" /> Reject
                    </Button>
                    <Button onClick={() => handleNoticeAction(notice.id, 'approved')} className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="admins" className="mt-6 space-y-6">
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardHeader>
              <CardTitle>Manage Admin Team</CardTitle>
              <CardDescription>Add or remove administrators. The primary admin cannot be removed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-2">
                <Input 
                  placeholder="Search user by name or PRN..." 
                  value={adminSearch}
                  onChange={(e) => setAdminSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  className="rounded-xl"
                />
                <Button onClick={searchUsers} disabled={isSearching} className="rounded-xl bg-blue-600">
                  {isSearching ? <Loader2 className="animate-spin h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                </Button>
              </div>

              {foundUsers.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Results</p>
                  {foundUsers.map(u => (
                    <div key={u.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-sm font-medium">{u.full_name}</p>
                        <p className="text-xs text-slate-500">PRN: {u.prn}</p>
                      </div>
                      <Button size="sm" onClick={() => addAdmin(u.id)} className="rounded-lg bg-blue-600 h-8">Add Admin</Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-3 pt-4">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Admins</p>
                {admins.map(admin => (
                  <div key={admin.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {admin.full_name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{admin.full_name}</p>
                        <p className="text-xs text-slate-500">PRN: {admin.prn}</p>
                      </div>
                    </div>
                    {isSoleAdmin && admin.email !== SOLE_ADMIN_EMAIL ? (
                      <Button variant="ghost" size="icon" onClick={() => removeAdmin(admin.id, admin.email)} className="text-red-500 hover:bg-red-50 rounded-full">
                        <UserMinus className="h-4 w-4" />
                      </Button>
                    ) : admin.email === SOLE_ADMIN_EMAIL ? (
                      <Badge className="bg-blue-50 text-blue-600 border-0">Sole Admin</Badge>
                    ) : null}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
