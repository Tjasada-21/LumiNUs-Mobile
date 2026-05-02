import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL) {
  console.error('[supabase] Missing EXPO_PUBLIC_SUPABASE_URL environment variable');
}

if (!SUPABASE_ANON_KEY) {
  console.error('[supabase] Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable');
}

const supabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    })
  : null;

if (supabase) {
  console.log('[supabase] Client initialized successfully');
  console.log('[supabase] URL:', SUPABASE_URL);
} else {
  console.error('[supabase] Failed to initialize - missing credentials');
}

export default supabase;
