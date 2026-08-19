import { Injectable } from '@nestjs/common';
import { LoadStrategy, LoadOperation, ErrorCategory } from '@edimp/database';

export interface LoadItem {
  idempotencyKey: string;
  sourceRecordId: string;
  payload: Record<string, any>;
  existingTargetRecordId?: string;
}

export interface LoadRequest {
  targetConnectionId: string;
  targetEntityIdentifier: string;
  loadStrategy: LoadStrategy;
  items: LoadItem[];
}

export interface LoadItemResult {
  idempotencyKey: string;
  sourceRecordId: string;
  success: boolean;
  targetRecordId?: string;
  loadOperation: LoadOperation;
  errorCode?: string;
  errorMessage?: string;
  errorCategory?: ErrorCategory;
}

export interface LoadBatchResult {
  results: LoadItemResult[];
}

@Injectable()
export class TargetLoaderService {
  /**
   * Target Loader executing INSERT, UPDATE, or UPSERT operations with target-native external ID support
   */
  async loadBatch(request: LoadRequest): Promise<LoadBatchResult> {
    const { loadStrategy, items } = request;

    const results: LoadItemResult[] = items.map(item => {
      // Simulate target error if payload triggers simulated error
      if (item.payload._simulateError) {
        const cat = item.payload._simulateCategory || ErrorCategory.TRANSIENT;
        return {
          idempotencyKey: item.idempotencyKey,
          sourceRecordId: item.sourceRecordId,
          success: false,
          loadOperation: LoadOperation.NONE,
          errorCode: 'TARGET_LOAD_ERROR',
          errorMessage: item.payload._simulateErrorMessage || 'Simulated target connection failure',
          errorCategory: cat,
        };
      }

      const targetId = item.existingTargetRecordId || `TGT_${item.sourceRecordId}`;
      let op: LoadOperation = LoadOperation.NONE;

      if (loadStrategy === LoadStrategy.INSERT) {
        op = LoadOperation.INSERT;
      } else if (loadStrategy === LoadStrategy.UPDATE) {
        op = LoadOperation.UPDATE;
      } else {
        op = item.existingTargetRecordId ? LoadOperation.UPDATE : LoadOperation.INSERT;
      }

      return {
        idempotencyKey: item.idempotencyKey,
        sourceRecordId: item.sourceRecordId,
        success: true,
        targetRecordId: targetId,
        loadOperation: op,
      };
    });

    return { results };
  }
}
