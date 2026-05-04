'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, BookOpen, Bell, MessageSquare, FileText, Loader2, SlidersHorizontal, X } from 'lucide-react';
import Link from 'next/link';
import { useDebounce } from 'use-debounce';
import { useEffect } from 'react';
import { format } from 'date-fns';
import { useSearchParams } from 'next/navigation';

export default function SearchPage() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery] = useDebounce(query, 400);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterSemester, setFilterSemester] = useState('');
  const [sort, setSort] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (initialQuery && !query) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    if (!debouncedQuery.trim()) { setResults(null); return; }
    performSearch();
  }, [debouncedQuery, filterType, filterSubject, filterSemester, sort]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ q: debouncedQuery, sort });
      if (filterType) params.append('type', filterType);
      if (filterSubject) params.append('subject', filterSubject);
      if (filterSemester) params.append('semester', filterSemester);

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/search?${params}`);
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const clearFilters = () => { setFilterType(''); setFilterSubject(''); setFilterSemester(''); setSort('newest'); };
  const hasFilters = filterType || filterSubject || filterSemester || sort !== 'newest';

  const typeIcon = (type: string) => {
    if (type === 'notes') return <BookOpen className="h-4 w-4" />;
    if (type === 'notices') return <Bell className="h-4 w-4" />;
    if (type === 'requests') return <MessageSquare className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const typeHref = (type: string) => {
    if (type === 'notes' || type === 'pyqs' || type === 'assignments' || type === 'solutions') return `/${type}`;
    if (type === 'notices' || type === 'requests') return `/${type}`;
    return '/';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 flex items-center gap-3">
          <Search className="h-8 w-8 text-blue-600" />
          Search AFIN
        </h1>
        <p className="text-slate-500 mt-1">Search across notes, notices, requests and more.</p>
      </div>

      {/* Search Bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search for notes, notices, requests..."
            className="pl-9 rounded-xl h-12 text-base bg-white border-slate-200 focus-visible:ring-blue-500" autoFocus />
        </div>
        <Button variant="outline" onClick={() => setShowFilters(!showFilters)}
          className={`rounded-xl h-12 gap-2 ${showFilters ? 'bg-blue-50 border-blue-200 text-blue-700' : ''}`}>
          <SlidersHorizontal className="w-4 h-4" /> Filters
          {hasFilters && <Badge className="bg-blue-600 text-white text-[10px] px-1.5 py-0 ml-1">ON</Badge>}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="pt-4 pb-4">
            <div className="flex flex-wrap gap-3 items-end">
              <div className="space-y-1 min-w-[140px]">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</label>
                <Select value={filterType} onValueChange={(val) => val !== null && setFilterType(val)}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="All types" /></SelectTrigger>
                  <SelectContent><SelectItem value="">All</SelectItem><SelectItem value="notes">Notes</SelectItem>
                    <SelectItem value="pyqs">PYQs</SelectItem><SelectItem value="assignments">Assignments</SelectItem>
                    <SelectItem value="solutions">Solutions</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[120px]">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Semester</label>
                <Select value={filterSemester} onValueChange={(val) => val !== null && setFilterSemester(val)}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>{Array.from({ length: 8 }, (_, i) => i + 1).map(s => (
                    <SelectItem key={s} value={String(s)}>Sem {s}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1 min-w-[140px]">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Sort</label>
                <Select value={sort} onValueChange={(val) => val !== null && setSort(val)}>
                  <SelectTrigger className="rounded-xl h-9"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="newest">Newest First</SelectItem></SelectContent>
                </Select>
              </div>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="rounded-xl text-slate-500 h-9 gap-1.5">
                  <X className="w-3.5 h-3.5" /> Clear
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
      )}

      {!loading && query && results && (
        <div className="space-y-6">
          {results.total === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-slate-200">
              <Search className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500">No results found for "<strong>{query}</strong>"</p>
              <p className="text-sm text-slate-400 mt-1">Try a different keyword or remove filters.</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-slate-500 font-medium">{results.total} result{results.total !== 1 ? 's' : ''} for "{query}"</p>

              {results.content?.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Content</h2>
                  <div className="space-y-2">
                    {results.content.map((item: any) => (
                      <Link key={item.id} href={typeHref(item.type)}
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">{typeIcon(item.type)}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.type} • Sem {item.semester} • {item.subject}</p>
                        </div>
                        <Badge variant="outline" className="shrink-0 text-[10px] capitalize bg-green-50 text-green-700 border-green-200">Verified</Badge>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.notices?.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Notices</h2>
                  <div className="space-y-2">
                    {results.notices.map((item: any) => (
                      <Link key={item.id} href="/notices"
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><Bell className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500 capitalize">{item.category} • {format(new Date(item.created_at), 'MMM d')}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}

              {results.requests?.length > 0 && (
                <section className="space-y-2">
                  <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Requests</h2>
                  <div className="space-y-2">
                    {results.requests.map((item: any) => (
                      <Link key={item.id} href="/requests"
                        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-blue-200 hover:shadow-sm transition-all">
                        <div className="p-2 bg-purple-50 rounded-lg text-purple-600"><MessageSquare className="h-4 w-4" /></div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-slate-900 truncate">{item.title}</p>
                          <p className="text-xs text-slate-500">{item.subject} • by {item.users?.full_name}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}

      {!query && (
        <div className="text-center py-20 text-slate-400">
          <Search className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Start typing to search across AFIN</p>
        </div>
      )}
    </div>
  );
}
