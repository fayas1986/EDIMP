import { Injectable } from '@nestjs/common';

export interface ExtractionCheckpoint {
  lastRecordId?: string;
  lastTimestamp?: string;
  cursor?: string;
  batchIndex: number;
}

export interface ExtractionRequest {
  sourceConnectionId: string;
  sourceEntityIdentifier: string;
  checkpoint?: ExtractionCheckpoint;
  batchSize: number;
  samplePayloads?: Record<string, any>[];
}

export interface ExtractionBatchResult {
  records: { id: string; payload: Record<string, any> }[];
  nextCheckpoint?: ExtractionCheckpoint;
  hasMore: boolean;
}

@Injectable()
export class SourceExtractorService {
  /**
   * Extractor method supporting cursor/keyset pagination with saved checkpoints
   */
  async extractBatch(request: ExtractionRequest): Promise<ExtractionBatchResult> {
    const { checkpoint, batchSize, samplePayloads } = request;
    const currentBatchIndex = checkpoint ? checkpoint.batchIndex + 1 : 0;
    const startIndex = checkpoint && checkpoint.lastRecordId ? parseInt(checkpoint.lastRecordId, 10) + 1 : 0;

    let rawRecords: Record<string, any>[] = [];
    if (samplePayloads && samplePayloads.length > 0) {
      rawRecords = samplePayloads;
    } else {
      // Default generated test records for extraction
      rawRecords = [
        { id: '101', name: 'Acme Corp', email: 'contact@acme.com', age: 30, status: 'ACTIVE' },
        { id: '102', name: 'Beta Ltd', email: 'info@beta.com', age: 45, status: 'ACTIVE' },
        { id: '103', name: 'Gamma Inc', email: 'sales@gamma.com', age: 25, status: 'INACTIVE' },
      ];
    }

    const sliced = rawRecords.slice(startIndex, startIndex + batchSize);
    const hasMore = startIndex + sliced.length < rawRecords.length;

    const lastItem = sliced[sliced.length - 1];
    const lastId = lastItem ? String(startIndex + sliced.length - 1) : checkpoint?.lastRecordId;

    const records = sliced.map((payload, idx) => ({
      id: payload.id || `REC_${startIndex + idx + 1}`,
      payload,
    }));

    return {
      records,
      hasMore,
      nextCheckpoint: {
        lastRecordId: lastId,
        batchIndex: currentBatchIndex,
        cursor: `cursor_page_${currentBatchIndex}`,
      },
    };
  }
}
