'use client';

import { useAuth } from '@/components/auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSoleAdmin, dbUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && dbUser && dbUser.role !== 'admin' && !isSoleAdmin) {
      router.push('/');
    }
  }, [loading, dbUser, isSoleAdmin, router]);

  if (loading || (!isSoleAdmin && dbUser?.role !== 'admin')) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm sticky top-0 z-10">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">AFIN Admin</h1>
          <p className="text-sm text-slate-500">Manage Users and Verification</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-sm font-medium text-blue-600 hover:text-blue-700 transition-colors bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg"
        >
          Back to Portal
        </button>
      </header>
      <main className="flex-1 p-6 md:p-12 max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
