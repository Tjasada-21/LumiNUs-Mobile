import { createClient } from '@supabase/supabase-js';

// You get these two keys from your Supabase Dashboard -> Settings -> API
const supabaseUrl = 'https://pmnirrvwibzqjlutbnwz.supabase.co';
const supabaseAnonKey = 'sb_publishable_0VIz-g6h-Hn15Ini49cgug_uqAgDn_n';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);