import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://nxbuioobdluvdhgjqtee.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_Uo-RaSl3WH0jDADMHqjvqQ_CAhTPMcN';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});