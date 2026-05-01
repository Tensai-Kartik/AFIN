'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export const SOLE_ADMIN_EMAIL = 'anonymouskiraiskilling@gmail.com';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  dbUser: any | null;
  loading: boolean;
  /** True only when the DB user has role = 'verified_student' or 'admin' */
  isVerified: boolean;
  /** True only when the user is the sole admin */
  isSoleAdmin: boolean;
  /** True when the DB user has submitted their profile (PRN no longer PENDING) */
  hasPendingVerification: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  dbUser: null,
  loading: true,
  isVerified: false,
  isSoleAdmin: false,
  hasPendingVerification: false,
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [dbUser, setDbUser] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const fetchDbUser = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching db user:', error);
    } else {
      setDbUser(data);
      // NO forced redirect — profile completion is optional/voluntary
    }
  };

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchDbUser(session.user.id).finally(() => {
          if (isMounted) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchDbUser(session.user.id);
        } else {
          setDbUser(null);
          if (pathnameRef.current !== '/login') router.push('/login');
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const isVerified = dbUser?.role === 'verified_student' || dbUser?.role === 'admin';
  const isSoleAdmin = user?.email === SOLE_ADMIN_EMAIL;
  // Profile submitted = PRN is no longer PENDING but not yet admin-verified
  const hasPendingVerification =
    dbUser !== null &&
    !dbUser?.prn?.startsWith('PENDING-') &&
    dbUser?.status === 'pending';

  return (
    <AuthContext.Provider
      value={{ user, session, dbUser, loading, isVerified, isSoleAdmin, hasPendingVerification, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
