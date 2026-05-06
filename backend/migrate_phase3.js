
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Starting Phase 3 Migration...');

  const sql = `
    -- 1. Notifications Table
    CREATE TABLE IF NOT EXISTS public.notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      message TEXT NOT NULL,
      type TEXT NOT NULL, -- 'assignment_due', 'new_content', 'request_answered', 'placement'
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 2. Skills Marketplace
    CREATE TABLE IF NOT EXISTS public.skills (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      price_or_barter TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
    );

    -- 3. Market Requests
    CREATE TABLE IF NOT EXISTS public.requests_market (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      budget TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL
    );

    -- 4. User Analytics & Digital Twin
    CREATE TABLE IF NOT EXISTS public.user_analytics (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
      uploads_count INTEGER DEFAULT 0,
      downloads_count INTEGER DEFAULT 0,
      requests_activity INTEGER DEFAULT 0,
      engagement_score FLOAT DEFAULT 0,
      last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- 5. Update Users Table for analytics and points
    DO $$ 
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='points') THEN
        ALTER TABLE public.users ADD COLUMN points INTEGER DEFAULT 0;
      END IF;
      
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='engagement_score') THEN
        ALTER TABLE public.users ADD COLUMN engagement_score FLOAT DEFAULT 0;
      END IF;

      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_active_at') THEN
        ALTER TABLE public.users ADD COLUMN last_active_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
      END IF;
    END $$;

    -- Enable RLS
    ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.requests_market ENABLE ROW LEVEL SECURITY;
    ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;

    -- RLS Policies
    DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
    CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
    CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Public can view active skills" ON public.skills;
    CREATE POLICY "Public can view active skills" ON public.skills FOR SELECT USING (deleted_at IS NULL);

    DROP POLICY IF EXISTS "Users can manage own skills" ON public.skills;
    CREATE POLICY "Users can manage own skills" ON public.skills FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Public can view active market requests" ON public.requests_market;
    CREATE POLICY "Public can view active market requests" ON public.requests_market FOR SELECT USING (deleted_at IS NULL);

    DROP POLICY IF EXISTS "Users can manage own market requests" ON public.requests_market;
    CREATE POLICY "Users can manage own market requests" ON public.requests_market FOR ALL USING (auth.uid() = user_id);

    DROP POLICY IF EXISTS "Users can view own analytics" ON public.user_analytics;
    CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING (auth.uid() = user_id);
  `;

  // Since supabase-js doesn't have a direct "execute arbitrary SQL" method in the client,
  // and we don't have the management API or CLI working, 
  // we will try to use the 'rpc' method if we have a custom function, or just assume the user
  // will run this in Supabase SQL editor if this script can't do it.
  // HOWEVER, I can use the Supabase REST API to run this if I had the management token.
  // Actually, I can just tell the user to run it.
  
  console.log('⚠️ Please run the following SQL in your Supabase SQL Editor:');
  console.log(sql);
}

runMigration();
