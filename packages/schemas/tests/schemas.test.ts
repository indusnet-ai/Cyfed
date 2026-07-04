import { describe, it, expect } from 'vitest';
import { NodeRegisterSchema, CreateTaskSchema } from '../src/index';

describe('Schemas package tests', () => {
  it('should validate correct node registrations', () => {
    const input = {
      name: 'Central-Bank',
      type: 'bank',
      status: 'idle',
      datasetSize: 100,
    };
    const result = NodeRegisterSchema.safeParse(input);
    expect(result.success).toBe(true);
  });

  it('should reject invalid node registrations', () => {
    const input = {
      name: 'a', // Too short
      type: 'unknown_type', // Invalid enum
    };
    const result = NodeRegisterSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('should validate task creation with defaults', () => {
    const input = {
      name: 'XGBoost Classification Task',
      modelType: 'xgboost',
    };
    const result = CreateTaskSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.targetAccuracy).toBe(0.9);
      expect(result.data.minClients).toBe(2);
    }
  });
});
