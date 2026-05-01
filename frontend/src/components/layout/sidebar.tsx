'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  BookOpen,
  FileText,
  ClipboardList,
  MessageSquare,
  Bookmark,
  Shield,
  Home,
  Bell,
  UserCircle,
  Users,
  CheckSquare,
  UsersRound,
} from 'lucide-react';
import { useAuth } from '../auth-provider';



const routes = [
  { name: 'Dashboard', path: '/', icon: Home },
  { name: 'Notes', path: '/notes', icon: BookOpen },
  { name: 'PYQs', path: '/pyqs', icon: FileText },
  { name: 'Assignments', path: '/assignments', icon: ClipboardList },
  { name: 'Notices', path: '/notices', icon: Bell },
  { name: 'Requests', path: '/requests', icon: MessageSquare },
  { name: 'Bookmarks', path: '/bookmarks', icon: Bookmark },
];

export function Sidebar() {
  const pathname = usePathname();
  const { dbUser, isVerified, hasPendingVerification } = useAuth();

  const isAdmin = dbUser?.role === 'admin';
  const showVerifyBadge = !isVerified && !hasPendingVerification;

  return (
    <div className="hidden lg:flex w-64 flex-col bg-white border-r border-slate-200 h-[calc(100vh-64px)] overflow-y-auto">
      <div className="flex-1 py-6 px-4 space-y-1">
        {routes.map((route) => {
          const isActive = pathname === route.path;
          return (
            <Link
              key={route.path}
              href={route.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                isActive 
                  ? "bg-blue-50 text-blue-600" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <route.icon className={cn("h-5 w-5", isActive ? "text-blue-600" : "text-slate-400")} />
              {route.name}
            </Link>
          );
        })}

        {isAdmin && (
          <>
            <div className="pt-4 mt-4 border-t border-slate-100">
              <p className="px-3 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Admin</p>
              <Link
                href="/admin"
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                  pathname === '/admin'
                    ? "bg-blue-50 text-blue-600"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                )}
              >
                <Shield className={cn("h-5 w-5", pathname === '/admin' ? "text-blue-600" : "text-slate-400")} />
                Admin Panel
              </Link>
              
              {/* Direct Admin Links */}
              <div className="pl-4 space-y-1 mt-1">
                {[
                  { name: 'Verifications', icon: Users, tab: 'users' },
                  { name: 'Approve Content', icon: CheckSquare, tab: 'content' },
                  { name: 'Approve Notices', icon: Bell, tab: 'notices' },
                  { name: 'Manage Admins', icon: UsersRound, tab: 'admins' },
                ].map((adminLink) => (
                  <Link
                    key={adminLink.name}
                    href={`/admin?tab=${adminLink.tab}`}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-slate-500 hover:bg-slate-50 hover:text-blue-600 transition-all"
                  >
                    <adminLink.icon className="h-4 w-4" />
                    {adminLink.name}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
        {/* Profile link at the bottom */}
        <div className="pt-4 mt-4 border-t border-slate-100">
          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
              pathname === '/profile'
                ? "bg-blue-50 text-blue-600"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <UserCircle className={cn("h-5 w-5", pathname === '/profile' ? "text-blue-600" : "text-slate-400")} />
            <span className="flex-1">Profile</span>
            {showVerifyBadge && (
              <span className="h-2 w-2 rounded-full bg-amber-400" title="Verify your identity" />
            )}
          </Link>
        </div>
      </div>
    </div>
  );
}
