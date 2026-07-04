import pino from 'pino';

// Define the core types for our Federated AI Platform

export interface FLNode {
  id: string;
  name: string;
  type: 'bank' | 'hospital' | 'retail' | 'telecom' | 'generic';
  status: 'idle' | 'training' | 'offline' | 'error';
  lastActive: string;
  ipAddress?: string;
  datasetSize?: number;
}

export interface FLMetrics {
  round: number;
  loss: number;
  accuracy: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  timestamp: string;
}

export interface FLRoundInfo {
  roundId: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  participatingNodes: string[];
  metrics?: FLMetrics;
}

export interface FLTask {
  taskId: string;
  name: string;
  modelType: string;
  targetAccuracy: number;
  minClients: number;
  maxRounds: number;
  status: 'created' | 'active' | 'finished' | 'aborted';
  createdAt: string;
  completedAt?: string;
}

// Local LLM / Ollama interface types
export interface LLMConfig {
  provider: 'ollama' | 'openai' | 'claude' | 'qwen';
  modelName: string;
  baseUrl?: string;
  apiKey?: string;
}

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMResponse {
  content: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// Logger wrapper
export const createLogger = (name: string) => {
  try {
    return pino({
      name,
      level: process.env.LOG_LEVEL || 'info',
      transport: (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test' && !process.env.NEXT_RUNTIME) ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
        }
      } : undefined
    });
  } catch (e) {
    return pino({
      name,
      level: process.env.LOG_LEVEL || 'info'
    });
  }
};

export const logger = createLogger('fedsoc-ai');
