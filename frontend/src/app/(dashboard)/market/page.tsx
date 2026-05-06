'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ShoppingBag, Search, Plus, Filter, MessageSquare, Tag, Wallet, Loader2, Sparkles, Trash2, Phone, Copy, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/components/auth-provider';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketPage() {
  const { dbUser, session } = useAuth();
  const [skills, setSkills] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('skills');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [contactItem, setContactItem] = useState<any>(null);

  const fetchData = async () => {
    try {
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const [skillsRes, reqRes] = await Promise.all([
        fetch(`${backendUrl}/api/market/skills`),
        fetch(`${backendUrl}/api/market/requests`)
      ]);
      
      const skillsData = await skillsRes.json();
      const reqData = await reqRes.json();

      // DEBUG: log full first skill to check contact_number
      if (Array.isArray(skillsData) && skillsData.length > 0) {
        console.log('[MARKET] First skill from API:', JSON.stringify(skillsData[0], null, 2));
      }

      setSkills(Array.isArray(skillsData) ? skillsData : []);
      setRequests(Array.isArray(reqData) ? reqData : []);
    } catch (err) {
      console.error('Market fetch error:', err);
      setSkills([]);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handlePost = async (e: React.FormEvent<HTMLFormElement>, type: 'skill' | 'request') => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    const payload = Object.fromEntries(formData.entries());
    console.log('[MARKET] Frontend Post Payload:', payload);

    try {
      if (!session?.access_token) {
        throw new Error('You must be logged in to post.');
      }
      const token = session.access_token;
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

      const res = await fetch(`${backendUrl}/api/market/${type === 'skill' ? 'skills' : 'requests'}`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to post');
      }
      toast.success(`${type === 'skill' ? 'Skill' : 'Request'} posted successfully!`);
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Post error:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, type: 'skill' | 'request') => {
    if (!confirm('Are you sure you want to delete this listing?')) return;
    try {
      const token = session?.access_token;
      if (!token) throw new Error('You must be logged in to delete.');
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      // Use the existing unified delete endpoint
      const module = type === 'skill' ? 'market-skill' : 'market-request';
      const res = await fetch(`${backendUrl}/api/delete/${module}/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to delete');
      }
      toast.success(`${type === 'skill' ? 'Skill' : 'Request'} deleted successfully`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'You can only delete your own listings');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
            <ShoppingBag className="h-8 w-8 text-pink-600" /> Skill Marketplace
          </h1>
          <p className="text-slate-500 mt-1">Trade your expertise or request services from fellow students.</p>
        </div>

        <Button
          className="rounded-xl bg-pink-600 hover:bg-pink-700 text-white shadow-md"
          onClick={() => setIsModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> {activeTab === 'skills' ? 'Post Skill' : 'Post Request'}
        </Button>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="sm:max-w-[425px] rounded-2xl">
            <DialogHeader>
              <DialogTitle>Post to Marketplace</DialogTitle>
            </DialogHeader>
            <form onSubmit={(e) => handlePost(e, activeTab === 'skills' ? 'skill' : 'request')} className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input id="title" name="title" placeholder="What are you offering/looking for?" required className="rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" placeholder="Provide more details..." required className="rounded-xl h-24" />
              </div>
              <div className="space-y-2">
                <Label htmlFor={activeTab === 'skills' ? 'price_or_barter' : 'budget'}>
                  {activeTab === 'skills' ? 'Price or Barter' : 'Budget (e.g. ₹200, 1 Coffee)'}
                </Label>
                <Input 
                  id={activeTab === 'skills' ? 'price_or_barter' : 'budget'} 
                  name={activeTab === 'skills' ? 'price_or_barter' : 'budget'} 
                  placeholder={activeTab === 'skills' ? 'e.g. ₹500 per session or Help with Math' : 'e.g. ₹100 or Pizza'} 
                  required 
                  className="rounded-xl" 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact_number">Contact Number (WhatsApp Preferred)</Label>
                <Input 
                  id="contact_number" 
                  name="contact_number" 
                  type="tel"
                  placeholder="e.g. 9876543210" 
                  required 
                  className="rounded-xl"
                  pattern="[0-9]{10,15}"
                  title="Please enter a valid phone number (10-15 digits)"
                />
              </div>
              <Button type="submit" className="w-full rounded-xl bg-pink-600 hover:bg-pink-700 h-11" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Post Now'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="skills" className="space-y-6" onValueChange={setActiveTab}>
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <TabsList className="bg-slate-100 p-1 rounded-xl h-12">
            <TabsTrigger value="skills" className="rounded-lg px-8 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Available Skills
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg px-8 h-10 data-[state=active]:bg-white data-[state=active]:shadow-sm">
              Work Requests
            </TabsTrigger>
          </TabsList>
          
          <div className="relative w-full sm:w-64 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
            <Input 
              placeholder="Search marketplace..." 
              className="pl-10 rounded-xl border-slate-200 focus:border-pink-300 transition-all bg-white" 
            />
          </div>
        </div>

        <TabsContent value="skills">
          {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-pink-500" /></div>
          : skills.length === 0 ? <NoItems />
          : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {skills.map((skill, index) => (
                <motion.div
                  key={skill.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MarketCard item={skill} type="skill" currentUser={dbUser} onDelete={handleDelete} onContact={setContactItem} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>

        <TabsContent value="requests">
          {loading ? <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-pink-500" /></div>
          : requests.length === 0 ? <NoItems />
          : (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
            >
              {requests.map((req, index) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <MarketCard item={req} type="request" currentUser={dbUser} onDelete={handleDelete} onContact={setContactItem} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </TabsContent>
      </Tabs>

      {/* Contact Details Modal */}
      <Dialog open={!!contactItem} onOpenChange={(open) => !open && setContactItem(null)}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-green-600" /> Contact Details
            </DialogTitle>
          </DialogHeader>
          {contactItem && (
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="h-12 w-12 rounded-full bg-white flex items-center justify-center border border-slate-200">
                  <span className="text-lg font-bold text-slate-700">{contactItem.users?.full_name?.charAt(0)}</span>
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">{contactItem.users?.full_name}</h4>
                  <p className="text-xs text-slate-500">{contactItem.title}</p>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Phone Number</Label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-white border border-slate-200 rounded-xl font-mono text-lg text-center font-bold tracking-wider">
                    {contactItem.contact_number || 'Not provided'}
                  </div>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-xl text-slate-500 hover:text-pink-600 hover:border-pink-200 transition-all active:scale-95"
                    onClick={() => {
                      const num = contactItem.contact_number || '';
                      if (num) {
                        navigator.clipboard.writeText(num);
                        toast.success('Number copied to clipboard!');
                      } else {
                        toast.error('No number to copy');
                      }
                    }}
                    title="Copy number"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button 
                  className="rounded-xl bg-green-600 hover:bg-green-700 h-12 gap-2 text-white shadow-lg shadow-green-100 transition-all active:scale-95"
                  onClick={() => {
                    const num = (contactItem.contact_number || '').replace(/\D/g,'');
                    if (num) {
                      const finalNum = num.length === 10 ? `91${num}` : num;
                      window.open(`https://wa.me/${finalNum}`, '_blank');
                    } else {
                      toast.error('WhatsApp number not available');
                    }
                  }}
                >
                  <MessageSquare className="h-4 w-4" /> WhatsApp
                </Button>
                <Button 
                  className="rounded-xl bg-slate-900 hover:bg-black h-12 gap-2 text-white shadow-lg shadow-slate-100 transition-all active:scale-95"
                  onClick={() => {
                    const num = contactItem.contact_number;
                    if (num) {
                      window.location.href = `tel:${num}`;
                    } else {
                      toast.error('Phone number not available');
                    }
                  }}
                >
                  <Phone className="h-4 w-4" /> Call Now
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MarketCard({ item, type, currentUser, onDelete, onContact }: { 
  item: any, 
  type: 'skill' | 'request', 
  currentUser: any, 
  onDelete: (id: string, type: 'skill' | 'request') => void,
  onContact: (item: any) => void
}) {
  const isOwner = currentUser?.id === item.user_id;
  const isAdmin = currentUser?.role === 'admin';
  const canDelete = isOwner || isAdmin;

  return (
    <Card className="rounded-2xl border-0 shadow-sm hover:shadow-md transition-all group overflow-hidden bg-white relative">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant="outline" className={`rounded-full ${type === 'skill' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-pink-50 text-pink-700 border-pink-100'} px-3`}>
            {type === 'skill' ? <Tag className="h-3 w-3 mr-1" /> : <Sparkles className="h-3 w-3 mr-1" />}
            {type === 'skill' ? 'Offering' : 'Wanted'}
          </Badge>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {new Date(item.created_at).toLocaleDateString()}
            </span>
            {canDelete && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-slate-300 hover:text-red-500 hover:bg-red-50"
                onClick={() => onDelete(item.id, type)}
                title="Delete listing"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
        <CardTitle className="text-xl mt-3 line-clamp-1 group-hover:text-pink-600 transition-colors">
          {item.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-4">
        <p className="text-sm text-slate-500 line-clamp-3 mb-4 h-[60px] leading-relaxed">
          {item.description}
        </p>
        <div className="flex items-center justify-between pt-4 border-t border-slate-50">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
              {item.users?.avatar_url ? (
                <img src={item.users.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-slate-400">{item.users?.full_name?.charAt(0)}</span>
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-900 leading-tight">{item.users?.full_name || 'Anonymous'}</span>
              <span className="text-[10px] text-slate-400 font-medium">PRN: {item.users?.prn || 'N/A'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Value</p>
            <p className="text-sm font-bold text-slate-900 flex items-center gap-1">
              <Wallet className="h-3 w-3 text-emerald-500" />
              {type === 'skill' ? item.price_or_barter : item.budget}
            </p>
          </div>
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          className="w-full rounded-xl bg-slate-900 hover:bg-black text-white h-10 gap-2"
          onClick={() => onContact(item)}
        >
          <MessageSquare className="h-4 w-4" /> Contact {type === 'skill' ? 'Expert' : 'Buyer'}
        </Button>
      </CardFooter>
    </Card>
  );
}

function NoItems() {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl border border-dashed border-slate-200">
      <div className="bg-slate-50 p-6 rounded-full mb-4">
        <ShoppingBag className="h-12 w-12 text-slate-200" />
      </div>
      <h3 className="text-xl font-bold text-slate-900">Market is quiet</h3>
      <p className="text-slate-500 mt-2 text-center max-w-sm">
        No postings here yet. Why not be the first to offer a skill or request help?
      </p>
    </div>
  );
}
