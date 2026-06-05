import { inject, Injectable } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { firstValueFrom, catchError, of } from 'rxjs';

export interface WrongAnswerEntry {
  id: string;
  sessionId: string;
  bankId: number;
  bankName?: string;
  questionId: number;
  questionContent: string;
  questionType?: string;
  selectedOptionId?: number;
  selectedOptionText?: string | null;
  correctOptionId?: number;
  correctOptionText?: string | null;
  attempts: number;
  lastAttemptAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class AutoCleanupService {
  private readonly STORE_NAME = 'wrongAnswersStore';
  private readonly ONE_DAY_MS = 24 * 60 * 60 * 1000;
  private readonly CLEANUP_INTERVAL = 60 * 60 * 1000; // Check every hour
  private cleanupTimer: any = null;

  private readonly db = inject(CatbeeIndexedDBService);

  /**
   * Initialize automatic cleanup of stale entries (older than 1 day)
   * Should be called once during app initialization
   */
  initializeAutoCleanup(): void {
    if (this.cleanupTimer) {
      return; // Already initialized
    }

    // First cleanup on initialization
    this.cleanupStaleEntries().catch((err) => console.error('Initial cleanup failed:', err));

    // Schedule periodic cleanup
    this.cleanupTimer = setInterval(() => {
      this.cleanupStaleEntries().catch((err) => console.error('Periodic cleanup failed:', err));
    }, this.CLEANUP_INTERVAL);
  }

  /**
   * Stop automatic cleanup
   */
  stopAutoCleanup(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Manually cleanup entries older than 1 day
   * Returns the count of deleted entries
   */
  async cleanupStaleEntries(): Promise<number> {
    try {
      const allEntries = await firstValueFrom(
        this.db.getAll<WrongAnswerEntry>(this.STORE_NAME).pipe(catchError(() => of([]))),
      );

      if (!allEntries || allEntries.length === 0) {
        return 0;
      }

      const now = Date.now();
      const staleEntries = allEntries.filter(
        (entry) => now - entry.lastAttemptAt > this.ONE_DAY_MS,
      );

      if (staleEntries.length === 0) {
        return 0;
      }

      // Delete all stale entries
      await Promise.all(
        staleEntries.map((entry) =>
          firstValueFrom(
            this.db.deleteByKey(this.STORE_NAME, entry.id).pipe(catchError(() => of(null))),
          ),
        ),
      );

      console.log(`[AutoCleanup] Removed ${staleEntries.length} stale wrong answer entries`);
      return staleEntries.length;
    } catch (error) {
      console.error('[AutoCleanup] Error during cleanup:', error);
      return 0;
    }
  }

  /**
   * Get statistics about the storage
   */
  async getStorageStats(): Promise<{ total: number; stale: number; recent: number }> {
    try {
      const allEntries = await firstValueFrom(
        this.db.getAll<WrongAnswerEntry>(this.STORE_NAME).pipe(catchError(() => of([]))),
      );

      if (!allEntries) {
        return { total: 0, stale: 0, recent: 0 };
      }

      const now = Date.now();
      const stale = allEntries.filter(
        (entry) => now - entry.lastAttemptAt > this.ONE_DAY_MS,
      ).length;
      const recent = allEntries.length - stale;

      return {
        total: allEntries.length,
        stale,
        recent,
      };
    } catch (error) {
      console.error('[AutoCleanup] Error getting stats:', error);
      return { total: 0, stale: 0, recent: 0 };
    }
  }
}
