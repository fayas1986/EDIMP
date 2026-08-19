import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class CanonicalJsonService {
  /**
   * Recursively canonicalizes a JSON structure by sorting object keys alphabetically
   */
  canonicalizeJson(obj: any): string {
    if (obj === null || obj === undefined || typeof obj !== 'object') {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return '[' + obj.map(item => this.canonicalizeJson(item)).join(',') + ']';
    }
    const sortedKeys = Object.keys(obj).sort();
    const keyPairs = sortedKeys.map(
      key => `${JSON.stringify(key)}:${this.canonicalizeJson(obj[key])}`,
    );
    return '{' + keyPairs.join(',') + '}';
  }

  /**
   * Computes SHA-256 hash of the canonicalized JSON object
   */
  computeCanonicalHash(obj: any): string {
    const canonicalStr = this.canonicalizeJson(obj);
    return crypto.createHash('sha256').update(canonicalStr).digest('hex');
  }

  /**
   * Computes stable SHA-256 idempotency key
   */
  computeIdempotencyKey(
    sourceConnectionId: string,
    sourceEntityIdentifier: string,
    sourceRecordId: string,
    targetEntityIdentifier: string,
    migrationConfigurationVersionId: string,
  ): string {
    const raw = `${sourceConnectionId}|${sourceEntityIdentifier}|${sourceRecordId}|${targetEntityIdentifier}|${migrationConfigurationVersionId}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }
}
