import { Injectable } from '@nestjs/common';
import { ErrorCategory } from '@edimp/database';

@Injectable()
export class RetryStrategyService {
  /**
   * Checks if an error category is eligible for automated retry
   */
  isRetryable(category: ErrorCategory): boolean {
    return [
      ErrorCategory.TRANSIENT,
      ErrorCategory.RATE_LIMIT,
      ErrorCategory.CONNECTIVITY,
    ].includes(category as any);
  }

  /**
   * Calculates exponential backoff in milliseconds with 30% random jitter
   */
  calculateBackoffMs(attemptCount: number, baseMs = 1000, maxMs = 30000): number {
    const exponential = Math.min(maxMs, baseMs * Math.pow(2, attemptCount));
    const jitter = Math.random() * 0.3 * exponential;
    return Math.floor(exponential + jitter);
  }
}
