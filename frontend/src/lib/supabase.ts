import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Uses createBrowserClient (from @supabase/ssr) instead of createClient
// so that the PKCE code_verifier is stored in cookies, not localStorage.
// This makes it accessible to the server-side /auth/callback Route Handler.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
