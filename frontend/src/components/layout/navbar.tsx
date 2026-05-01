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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bell, Search, Menu, FileText, Loader2, BookOpen, Shield, Users, CheckSquare, UsersRound } from 'lucide-react';
import { Input } from '../ui/input';
import { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import { supabase } from '@/lib/supabase';

export function Navbar() {
  const { user, dbUser, signOut } = useAuth();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery] = useDebounce(searchQuery, 400);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    if (debouncedQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const performSearch = async () => {
      setIsSearching(true);
      try {
        const { data, error } = await supabase
          .from('content')
          .select('id, title, type, subject')
          .eq('status', 'approved')
          .textSearch('title', `'${debouncedQuery}'`, { type: 'websearch', config: 'english' })
          .limit(5);

        if (error) throw error;

        // If no full text match, try ilike fallback
        if (!data || data.length === 0) {
           const { data: fallbackData } = await supabase
            .from('content')
            .select('id, title, type, subject')
            .eq('status', 'approved')
            .ilike('title', `%${debouncedQuery}%`)
            .limit(5);
           setSearchResults(fallbackData || []);
        } else {
           setSearchResults(data || []);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedQuery]);

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
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full bg-slate-50 border-slate-200 rounded-full pl-9 focus-visible:ring-blue-500 h-9"
            />
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
                    >
                      <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                        {result.type === 'notes' ? <BookOpen className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <p className="text-sm font-medium text-slate-900 truncate">{result.title}</p>
                        <p className="text-xs text-slate-500 capitalize">{result.type} • {result.subject}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-sm text-slate-500">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <Button variant="ghost" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5 text-slate-600" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-blue-600 border border-white"></span>
          </Button>

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
