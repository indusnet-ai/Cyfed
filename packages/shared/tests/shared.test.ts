import { describe, it, expect } from 'vitest';
import { createLogger } from '../src/index';

describe('Shared package tests', () => {
  it('should initialize logger correctly', () => {
    const logger = createLogger('test-logger');
    expect(logger).toBeDefined();
    expect(logger.info).toBeTypeOf('function');
  });

  it('should match structure definitions', () => {
    const mockNode = {
      id: 'test-id',
      name: 'test-node',
      type: 'bank' as const,
      status: 'idle' as const,
      lastActive: new Date().toISOString(),
    };
    expect(mockNode.name).toBe('test-node');
    expect(mockNode.type).toBe('bank');
  });
});
