import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from workspace root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),
  CLIENT_ORIGIN: z.string().default('http://localhost:5173,http://localhost:3000'),

  SUPABASE_URL: z.string().url().default('https://mock-supabase.supabase.co'),
  SUPABASE_ANON_KEY: z.string().default('mock-anon-key-for-development'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().default('mock-service-role-key-for-development'),

  GEMINI_API_KEY: z.string().default('mock-gemini-key'),
  GEMINI_MODEL: z.string().default('gemini-3.8-flash'),
  GEMINI_MODELS: z.string().default('gemini-3.8-flash,gemini-3.7-flash'),
  AI_DISABLED: z
    .string()
    .transform((val) => val === 'true')
    .default('false'),

  SESSION_SECRET: z.string().min(16).default('medisync-hackathon-curiousparc-secret-key-2026'),
  DEMO_PASSWORD: z.string().default('DemoPassword123!'),
  API_BASE_URL: z.string().default('http://localhost:4000'),

  STAFF_SIGNUP_CODE: z.string().default('MEDISYNC-STAFF-2026-ASTRA'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(600000), // 10 minutes
  LOG_LEVEL: z.string().default('info'),
});

const parsed = EnvSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Environment validation failed:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  throw new Error('Invalid environment configuration');
}

export const env = parsed.data;
