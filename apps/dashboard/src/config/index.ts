import { z } from 'zod';

const configSchema = z.object({
  FLOWER_SERVER_URL: z.string().default('http://localhost:8080'),
  OLLAMA_URL: z.string().default('http://localhost:11434'),
  OPENAI_API_KEY: z.string().optional(),
  SUPABASE_URL: z.string().optional(),
  SUPABASE_ANON_KEY: z.string().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
  POLLING_INTERVAL: z.coerce.number().default(6000),
  DEFAULT_LLM: z.string().default('llama3.1'),
  THREAT_THRESHOLD: z.coerce.number().default(0.85),
  APP_MODE: z.enum(['development', 'production', 'demo']).default('demo'),
});

// Safely parse environment variables
const envParsed = configSchema.safeParse({
  FLOWER_SERVER_URL: process.env.FLOWER_SERVER_URL,
  OLLAMA_URL: process.env.OLLAMA_URL,
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  POLLING_INTERVAL: process.env.POLLING_INTERVAL,
  DEFAULT_LLM: process.env.DEFAULT_LLM,
  THREAT_THRESHOLD: process.env.THREAT_THRESHOLD,
  APP_MODE: process.env.NODE_ENV === 'production' ? 'production' : 'demo',
});

if (!envParsed.success) {
  console.error('Invalid environment variables config:', envParsed.error.format());
  throw new Error('Invalid environment configuration');
}

export const fedsocConfig = envParsed.data;
export type FedsocConfig = z.infer<typeof configSchema>;
