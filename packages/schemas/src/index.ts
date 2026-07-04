import { z } from 'zod';

export const NodeRegisterSchema = z.object({
  name: z.string().min(2).max(50),
  type: z.enum(['bank', 'hospital', 'retail', 'telecom', 'generic']),
  status: z.enum(['idle', 'training', 'offline', 'error']).default('idle'),
  ipAddress: z.string().ip().optional(),
  datasetSize: z.number().int().nonnegative().optional(),
});

export type NodeRegisterInput = z.infer<typeof NodeRegisterSchema>;

export const NodeHeartbeatSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['idle', 'training', 'offline', 'error']),
  datasetSize: z.number().int().nonnegative().optional(),
});

export type NodeHeartbeatInput = z.infer<typeof NodeHeartbeatSchema>;

export const CreateTaskSchema = z.object({
  name: z.string().min(3).max(100),
  modelType: z.enum(['xgboost', 'random_forest', 'logistic_regression', 'neural_network']),
  targetAccuracy: z.number().min(0).max(1).default(0.9),
  minClients: z.number().int().min(1).default(2),
  maxRounds: z.number().int().min(1).default(10),
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;

export const MetricsReportSchema = z.object({
  round: z.number().int().nonnegative(),
  loss: z.number().nonnegative(),
  accuracy: z.number().min(0).max(1),
  precision: z.number().min(0).max(1).optional(),
  recall: z.number().min(0).max(1).optional(),
  f1Score: z.number().min(0).max(1).optional(),
});

export type MetricsReportInput = z.infer<typeof MetricsReportSchema>;

export const LLMConfigSchema = z.object({
  provider: z.enum(['ollama', 'openai', 'claude', 'qwen']).default('ollama'),
  modelName: z.string().default('llama3.1:8b'),
  baseUrl: z.string().url().optional(),
  apiKey: z.string().min(1).optional(),
});

export type LLMConfigInput = z.infer<typeof LLMConfigSchema>;

export const LLMChatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(['system', 'user', 'assistant']),
    content: z.string(),
  })),
  config: LLMConfigSchema.optional(),
});

export type LLMChatInput = z.infer<typeof LLMChatSchema>;
