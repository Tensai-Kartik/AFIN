'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { MapPin, Phone, Plus, Loader2, Search, Home, Package, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import Image from 'next/image';
import { useAuth } from '@/components/auth-provider';
import { ImageUpload } from '@/components/ImageUpload';
import { DeleteConfirmModal } from '@/components/ui/delete-confirm-modal';
import { Trash2 } from 'lucide-react';

function PostLostFoundForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('lost');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/utility/lost-found`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, title, description, location, contact_info: contact, images })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Posted successfully!');
      setOpen(false);
      setTitle(''); setDescription(''); setLocation(''); setContact(''); setType('lost'); setImages([]);
      onSuccess();
    } catch (err: any) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" />}>
        <Plus className="mr-2 h-4 w-4" /> Post Item
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Post Lost / Found Item</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(val) => val && setType(val)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="lost">Lost</SelectItem><SelectItem value="found">Found</SelectItem></SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Black wallet" className="rounded-xl" required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the item..." className="rounded-xl resize-none h-20" />
          </div>
          
          <ImageUpload 
            folderName="lost_found" 
            maxImages={5} 
            onUploadComplete={(urls) => setImages(urls)} 
          />
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Library" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Contact *</Label>
              <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone / Email" className="rounded-xl" required />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function PostAccommodationForm({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState('room_available');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [contact, setContact] = useState('');
  const [rent, setRent] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data: sess } = await supabase.auth.getSession();
      const token = sess.session?.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/utility/accommodation`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description, location, contact_info: contact, rent_range: rent, images })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Listing posted!');
      setOpen(false);
      setDescription(''); setLocation(''); setContact(''); setRent(''); setType('room_available'); setImages([]);
      onSuccess();
    } catch (err: any) { toast.error(err.message); } finally { setSubmitting(false); }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white" />}>
        <Plus className="mr-2 h-4 w-4" /> Post Listing
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px] rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Post Accommodation Listing</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(val) => val && setType(val)}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="room_available">Room Available</SelectItem>
                <SelectItem value="looking_for_roommate">Looking for Roommate</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe the room, preferences, etc." className="rounded-xl resize-none h-24" required />
          </div>

          <ImageUpload 
            folderName="accommodation" 
            maxImages={5} 
            onUploadComplete={(urls) => setImages(urls)} 
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={location} onChange={e => setLocation(e.target.value)} placeholder="Area / Society" className="rounded-xl" />
            </div>
            <div className="space-y-2">
              <Label>Rent Range</Label>
              <Input value={rent} onChange={e => setRent(e.target.value)} placeholder="e.g. ₹4000–6000" className="rounded-xl" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Contact *</Label>
            <Input value={contact} onChange={e => setContact(e.target.value)} placeholder="Phone / WhatsApp" className="rounded-xl" required />
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="rounded-xl">Cancel</Button>
            <Button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function CampusPage() {
  const { user, dbUser } = useAuth();
  const [lostFound, setLostFound] = useState<any[]>([]);
  const [accommodation, setAccommodation] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lfFilter, setLfFilter] = useState('');
  const [deleteConfig, setDeleteConfig] = useState<{ id: string, module: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchLostFound = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const params = lfFilter ? `?type=${lfFilter}` : '';
    const res = await fetch(`${backendUrl}/api/utility/lost-found${params}`);
    const data = await res.json();
    setLostFound(data.items || []);
  };

  const fetchAccommodation = async () => {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
    const res = await fetch(`${backendUrl}/api/utility/accommodation`);
    const data = await res.json();
    setAccommodation(data.listings || []);
  };

  useEffect(() => {
    Promise.all([fetchLostFound(), fetchAccommodation()]).finally(() => setLoading(false));
  }, [lfFilter]);

  const handleDelete = async () => {
    if (!deleteConfig) return;
    setDeleting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/delete/${deleteConfig.module}/${deleteConfig.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('Deleted successfully');
      if (deleteConfig.module === 'lost-found') fetchLostFound();
      else fetchAccommodation();
      setDeleteConfig(null);
    } catch (error: any) {
      console.error('Delete error:', error);
      toast.error(error.message || 'Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Home className="h-8 w-8 text-blue-600" /> Campus Hub
        </h1>
        <p className="text-slate-500 mt-1">Lost & Found, Accommodation, and campus utilities in one place.</p>
      </div>

      <Tabs defaultValue="lost-found" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
          <TabsTrigger value="lost-found" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Search className="w-4 h-4 mr-2" /> Lost & Found
          </TabsTrigger>
          <TabsTrigger value="accommodation" className="rounded-lg px-6 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Home className="w-4 h-4 mr-2" /> Accommodation
          </TabsTrigger>
        </TabsList>

        {/* Lost & Found */}
        <TabsContent value="lost-found" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex gap-2">
              {['', 'lost', 'found'].map(f => (
                <Button key={f} size="sm" variant={lfFilter === f ? 'default' : 'outline'}
                  className={`rounded-full ${lfFilter === f ? 'bg-blue-600 text-white' : ''}`}
                  onClick={() => setLfFilter(f)}>
                  {f === '' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
                </Button>
              ))}
            </div>
            {user && <PostLostFoundForm onSuccess={fetchLostFound} />}
          </div>

          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            : lostFound.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <Package className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No {lfFilter || ''} items posted yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {lostFound.map(item => (
                  <Card key={item.id} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge className={item.type === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}>
                          {item.type === 'lost' ? '🔍 Lost' : '✅ Found'}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{format(new Date(item.created_at), 'MMM d')}</span>
                          {(user?.id === item.created_by || dbUser?.role === 'admin') && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              onClick={() => setDeleteConfig({ id: item.id, module: 'lost-found' })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg mt-2">{item.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                      {item.images && item.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                          {item.images.map((url: string, i: number) => (
                            <Image key={i} src={url} alt="Lost/Found item" width={80} height={80} className="h-20 w-20 object-cover rounded-lg shrink-0 border border-slate-200" />
                          ))}
                        </div>
                      )}
                      {item.description && <p className="line-clamp-2">{item.description}</p>}
                      {item.location && <p className="flex items-center gap-1.5 text-slate-500"><MapPin className="w-3.5 h-3.5" />{item.location}</p>}
                      <p className="flex items-center gap-1.5 font-medium text-blue-600"><Phone className="w-3.5 h-3.5" />{item.contact_info}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </TabsContent>

        {/* Accommodation */}
        <TabsContent value="accommodation" className="space-y-4">
          <div className="flex justify-end">
            {user && <PostAccommodationForm onSuccess={fetchAccommodation} />}
          </div>
          {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            : accommodation.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
                <Home className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">No accommodation listings yet.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {accommodation.map(item => (
                  <Card key={item.id} className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <Badge className={item.type === 'room_available' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                          {item.type === 'room_available' ? '🏠 Room Available' : '🤝 Roommate Wanted'}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-400">{format(new Date(item.created_at), 'MMM d')}</span>
                          {(user?.id === item.created_by || dbUser?.role === 'admin') && (
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                              onClick={() => setDeleteConfig({ id: item.id, module: 'accommodation' })}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3 text-sm text-slate-600">
                      {item.images && item.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                          {item.images.map((url: string, i: number) => (
                            <Image key={i} src={url} alt="Accommodation" width={80} height={80} className="h-20 w-20 object-cover rounded-lg shrink-0 border border-slate-200" />
                          ))}
                        </div>
                      )}
                      <p className="line-clamp-3">{item.description}</p>
                      {item.location && <p className="flex items-center gap-1.5 text-slate-500"><MapPin className="w-3.5 h-3.5" />{item.location}</p>}
                      {item.rent_range && <p className="font-semibold text-slate-700">💰 {item.rent_range}</p>}
                      <p className="flex items-center gap-1.5 font-medium text-blue-600"><Phone className="w-3.5 h-3.5" />{item.contact_info}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
        </TabsContent>
      </Tabs>

      <DeleteConfirmModal 
        open={!!deleteConfig}
        onOpenChange={(open) => !open && setDeleteConfig(null)}
        onConfirm={handleDelete}
        loading={deleting}
      />
    </div>
  );
}
