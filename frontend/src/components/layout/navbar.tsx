'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../auth-provider';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, Menu, FileText, Loader2, BookOpen, Shield, Users, CheckSquare, UsersRound, ShieldAlert, SlidersHorizontal, MessageSquare } from 'lucide-react';
import { NotificationBell } from '../notification-bell';
import { Input } from '../ui/input';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const { user, dbUser, signOut, isVerified } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  
  // Search Filters
  const [searchType, setSearchType] = useState<string>('all');
  const [searchSemester, setSearchSemester] = useState<string>('all');
  const [searchSort, setSearchSort] = useState<string>('newest');

  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const params = new URLSearchParams({ q: debouncedQuery });
        if (searchType !== 'all') params.append('type', searchType);
        if (searchSemester !== 'all') params.append('semester', searchSemester);
        params.append('sort', searchSort);

        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
        const res = await fetch(`${backendUrl}/api/search?${params}`);
        const data = await res.json();
        
        // Flatten results for the dropdown
        const flattened = [
          ...(data.results || []).map((item: any) => ({ ...item, category: 'Content' })),
        ];
        
        setSearchResults(flattened.slice(0, 8));
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery, searchType, searchSemester, searchSort]);

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="flex h-16 items-center px-4 md:px-6 relative">
        
        <Button variant="ghost" size="icon" className="md:hidden mr-2">
          <Menu className="h-5 w-5" />
        </Button>

        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-blue-600 mr-6">
          <Link href="/">AFIN</Link>
        </div>

        <div className="hidden md:flex flex-1 max-w-md ml-4 relative">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search notes, notices..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowResults(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim()) {
                    router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
                    setShowResults(false);
                  }
                }}
                onFocus={() => setShowResults(true)}
                onBlur={() => setTimeout(() => setShowResults(false), 200)}
                className="w-full bg-slate-50 border-slate-200 rounded-full pl-9 pr-48 focus-visible:ring-blue-500 h-10 shadow-sm"
              />
              
              <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <Select value={searchType} onValueChange={(val) => val && setSearchType(val)}>
                  <SelectTrigger className="h-7 w-auto min-w-[70px] text-[10px] bg-white border-slate-200 rounded-lg px-2">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="pyqs">PYQs</SelectItem>
                    <SelectItem value="assignments">Assignments</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={searchSemester} onValueChange={(val) => val && setSearchSemester(val)}>
                  <SelectTrigger className="h-7 w-auto min-w-[60px] text-[10px] bg-white border-slate-200 rounded-lg px-2">
                    <SelectValue placeholder="Sem" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sem</SelectItem>
                    {[1,2,3,4,5,6,7,8].map(s => (
                      <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={searchSort} onValueChange={(val) => val && setSearchSort(val)}>
                  <SelectTrigger className="h-7 w-12 bg-white border-slate-200 rounded-lg px-2 flex items-center justify-center hover:bg-slate-50 transition-colors">
                    <SlidersHorizontal className="h-3 w-3 text-slate-500" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="oldest">Oldest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
          </div>
          
          {/* Search Dropdown */}
          {showResults && searchQuery.length > 0 && (
            <div className="absolute top-12 left-0 w-full bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 overflow-hidden">
              {isSearching ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-[300px] overflow-y-auto">
                  {searchResults.map((result) => (
                    <Link
                      key={result.id}
                      href={`/${result.type}`}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50 transition-colors"
                      onClick={() => setShowResults(false)}
                    >
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        {result.type === 'notes' ? <BookOpen className="h-4 w-4" /> : 
                         result.type === 'notices' ? <Bell className="h-4 w-4" /> :
                         result.type === 'requests' ? <MessageSquare className="h-4 w-4" /> :
                         <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                          {result.category && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">{result.category}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 capitalize">
                          {result.type} {result.semester ? `• Sem ${result.semester}` : ''} {result.subject ? `• ${result.subject}` : ''}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate-500">
                  No results found for "{searchQuery}"
                </div>
              )}
              {searchQuery.length > 0 && (
                <div className="border-t border-slate-100 mt-1">
                  <Link
                    href={`/search?q=${encodeURIComponent(searchQuery)}`}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                  >
                    See all results for "{searchQuery}"
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <NotificationBell />

          {!isVerified && dbUser && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
              <ShieldAlert className="h-3 w-3" /> Unverified Account
            </div>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger className="relative h-9 w-9 rounded-full outline-none cursor-pointer hover:bg-slate-100 transition-colors flex items-center justify-center">
              <Avatar className="h-9 w-9">
                <AvatarImage src={dbUser?.avatar_url || user?.user_metadata?.avatar_url} alt="Avatar" />
                <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                  {dbUser?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 rounded-xl border-slate-200 shadow-xl" align="end">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{dbUser?.full_name || 'User'}</p>
                  <p className="text-xs leading-none text-slate-500">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer rounded-lg"
                onClick={() => router.push('/profile')}
              >
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer rounded-lg">
                Settings
              </DropdownMenuItem>

              {dbUser?.role === 'admin' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuLabel className="text-[10px] uppercase text-slate-400 font-bold tracking-widest pb-1">Admin Tools</DropdownMenuLabel>
                  <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => router.push('/admin?tab=users')}>
                    <Users className="mr-2 h-4 w-4 text-blue-600" /> Verifications
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => router.push('/admin?tab=content')}>
                    <CheckSquare className="mr-2 h-4 w-4 text-blue-600" /> Approve Content
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => router.push('/admin?tab=notices')}>
                    <Bell className="mr-2 h-4 w-4 text-blue-600" /> Approve Notices
                  </DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer rounded-lg" onClick={() => router.push('/admin?tab=admins')}>
                    <UsersRound className="mr-2 h-4 w-4 text-blue-600" /> Manage Admins
                  </DropdownMenuItem>
                </>
              )}

              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer text-red-600 focus:bg-red-50 rounded-lg" onClick={signOut}>
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
