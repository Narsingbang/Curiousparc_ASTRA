import { createClient } from '@supabase/supabase-js';
import { clientEnv } from './env';

export const isClientMock =
  !clientEnv.VITE_SUPABASE_URL ||
  clientEnv.VITE_SUPABASE_URL.includes('YOUR-PROJECT-REF') ||
  clientEnv.VITE_SUPABASE_URL.includes('mock-supabase');

export const supabase = createClient(
  clientEnv.VITE_SUPABASE_URL,
  clientEnv.VITE_SUPABASE_ANON_KEY
);
