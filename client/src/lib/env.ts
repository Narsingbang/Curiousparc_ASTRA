import { z } from 'zod';

const ClientEnvSchema = z.object({
  VITE_SUPABASE_URL: z.string().default('https://mock-supabase.supabase.co'),
  VITE_SUPABASE_ANON_KEY: z.string().default('mock-anon-key'),
  VITE_API_BASE_URL: z.string().default('/api'),
  VITE_APP_NAME: z.string().default('MediSync AI'),
  VITE_DEMO_MODE: z
    .string()
    .transform((v) => v === 'true')
    .default('true'),
});

export const clientEnv = ClientEnvSchema.parse(import.meta.env);
