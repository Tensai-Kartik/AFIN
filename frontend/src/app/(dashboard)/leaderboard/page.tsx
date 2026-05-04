'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Crown, Medal, Star, Upload } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

type LeaderboardUser = {
  id: string;
  full_name: string;
  prn: string;
  avatar_url: string;
  points: number;
  upload_count?: number;
};

export default function LeaderboardPage() {
  const [users, setUsers] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, full_name, prn, avatar_url, points')
        .eq('status', 'verified')
        .order('points', { ascending: false })
        .limit(50);

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="text-sm font-bold text-slate-500 w-5 text-center">{rank}</span>;
  };

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
    if (rank === 2) return 'bg-gradient-to-r from-slate-50 to-gray-50 border-slate-200';
    if (rank === 3) return 'bg-gradient-to-r from-orange-50 to-amber-50 border-orange-200';
    return '';
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-50 rounded-2xl mb-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Leaderboard</h1>
        <p className="text-slate-500 mt-1">Top contributors who make AFIN great. Earn points by uploading content!</p>
      </div>

      {/* Point Rules */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <div className="p-2 bg-blue-600 rounded-lg"><Upload className="w-4 h-4 text-white" /></div>
          <div><p className="text-xs text-blue-600 font-semibold">Upload Content</p><p className="text-lg font-bold text-blue-700">+10 pts</p></div>
        </div>
        <div className="flex items-center gap-3 p-3 bg-green-50 rounded-xl border border-green-100">
          <div className="p-2 bg-green-600 rounded-lg"><Star className="w-4 h-4 text-white" /></div>
          <div><p className="text-xs text-green-600 font-semibold">Content Approved</p><p className="text-lg font-bold text-green-700">+20 pts</p></div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
          <Trophy className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-slate-500">No contributors yet. Be the first to upload content!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {users.map((user, index) => {
            const rank = index + 1;
            return (
              <Card key={user.id} className={`rounded-2xl border shadow-sm hover:shadow-md transition-all ${getRankStyle(rank)}`}>
                <CardContent className="pt-4 pb-4 flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 shrink-0">
                    {getRankIcon(rank)}
                  </div>
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={user.avatar_url} alt={user.full_name} />
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold text-sm">
                      {user.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-500">{user.prn}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-lg font-bold text-blue-600">{user.points ?? 0}</p>
                    <p className="text-xs text-slate-400">points</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
