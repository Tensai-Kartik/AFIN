'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth-provider';
import { supabase } from '@/lib/supabase';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Loader2, CheckCircle, XCircle, Eye } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminPage() {
  const { dbUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

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

  if (dbUser?.role !== 'admin') {
    return <div className="text-center py-20 text-red-500">Access Denied. Admins only.</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Admin Dashboard</h1>
        <p className="text-slate-500 mt-1">Manage user verifications and content approvals.</p>
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="users">User Verification</TabsTrigger>
          <TabsTrigger value="content">Content Approval</TabsTrigger>
          <TabsTrigger value="audit">Audit Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="mt-6">
          {loading ? (
            <Loader2 className="animate-spin mx-auto mt-10" />
          ) : users.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed">No pending users.</div>
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
                    <Button onClick={() => handleUserAction(user.id, 'verified')} className="flex-1 rounded-xl bg-green-600 hover:bg-green-700">
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
            <Loader2 className="animate-spin mx-auto mt-10" />
          ) : content.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed">No pending content.</div>
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
                    <Button onClick={() => handleContentAction(item.id, 'approved')} className="flex-1 rounded-xl bg-green-600 hover:bg-green-700">
                      <CheckCircle className="mr-2 h-4 w-4" /> Approve
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="audit" className="mt-6">
           <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-slate-500">
             Audit log viewer coming soon...
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
