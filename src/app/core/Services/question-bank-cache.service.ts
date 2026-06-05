import { Injectable } from '@angular/core';

export interface QuestionBankCacheDbConfig {
  dbName: string;
  version: number;
  objectStore: string;
  keyPath: string;
  ttlMs: number;
}

export interface QuestionBankCacheEntry<T = unknown> {
  bankId: string;
  data: T;
  cachedAt: number;
}

const DEFAULT_QUESTION_BANK_CACHE_DB_CONFIG: QuestionBankCacheDbConfig = {
  dbName: 'ElmAppQuestionBankCache',
  version: 1,
  objectStore: 'question_banks',
  keyPath: 'bankId',
  ttlMs: 24 * 60 * 60 * 1000, // 24 hours
};

@Injectable({
  providedIn: 'root',
})
export class QuestionBankCacheService {
  private readonly config: QuestionBankCacheDbConfig = DEFAULT_QUESTION_BANK_CACHE_DB_CONFIG;

  private async openDatabase(): Promise<IDBDatabase> {
    return new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(this.config.dbName, this.config.version);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(this.config.objectStore)) {
          db.createObjectStore(this.config.objectStore, { keyPath: this.config.keyPath });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () => console.warn('[QuestionBankCache] IndexedDB upgrade blocked.');
    });
  }

  private async waitForTransaction(transaction: IDBTransaction): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  }

  private isExpired(entry: QuestionBankCacheEntry | undefined): boolean {
    return !entry || Date.now() - entry.cachedAt > this.config.ttlMs;
  }

  private sanitizeData(data: unknown): unknown {
    if (data === null || data === undefined) return data;
    if (typeof data !== 'object') return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const key of Object.keys(data)) {
      const value = (data as Record<string, unknown>)[key];
      const type = typeof value;

      if (type === 'function' || type === 'undefined') {
        continue;
      }

      if (type === 'object') {
        if (value === null) {
          sanitized[key] = null;
        } else if (Array.isArray(value)) {
          sanitized[key] = this.sanitizeData(value);
        } else if (value instanceof Date) {
          sanitized[key] = value.toISOString();
        } else if (typeof (value as { toJSON?: () => unknown }).toJSON === 'function') {
          sanitized[key] = (value as { toJSON: () => unknown }).toJSON();
        } else {
          sanitized[key] = this.sanitizeData(value);
        }
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }

  async saveBank(bankId: string, data: unknown): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(this.config.objectStore, 'readwrite');
      const store = transaction.objectStore(this.config.objectStore);

      const cleanedData = this.sanitizeData(data);
      const entry: QuestionBankCacheEntry = {
        bankId,
        data: cleanedData,
        cachedAt: Date.now(),
      };

      store.put(entry);
      await this.waitForTransaction(transaction);
      db.close();
      console.log(`[QuestionBankCache] Saved bankId=${bankId}`);
    } catch (error) {
      console.error('[QuestionBankCache] Failed to save bank:', error);
      throw error;
    }
  }

  async getBank<T = unknown>(bankId: string): Promise<T | null> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(this.config.objectStore, 'readonly');
      const store = transaction.objectStore(this.config.objectStore);
      const request = store.get(bankId);

      const result = await new Promise<QuestionBankCacheEntry<T> | undefined>((resolve, reject) => {
        request.onsuccess = () => resolve(request.result as QuestionBankCacheEntry<T> | undefined);
        request.onerror = () => reject(request.error);
      });

      await this.waitForTransaction(transaction);
      db.close();

      if (!result) {
        return null;
      }

      if (this.isExpired(result)) {
        await this.deleteBank(bankId);
        console.warn(`[QuestionBankCache] Expired bank removed: ${bankId}`);
        return null;
      }

      return result.data as T;
    } catch (error) {
      console.error('[QuestionBankCache] Failed to get bank:', error);
      return null;
    }
  }

  async getAllBanks<T = unknown>(): Promise<QuestionBankCacheEntry<T>[]> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(this.config.objectStore, 'readwrite');
      const store = transaction.objectStore(this.config.objectStore);
      const request = store.getAll();

      const entries = await new Promise<QuestionBankCacheEntry<T>[]>((resolve, reject) => {
        request.onsuccess = () => resolve((request.result || []) as QuestionBankCacheEntry<T>[]);
        request.onerror = () => reject(request.error);
      });

      const validEntries: QuestionBankCacheEntry<T>[] = [];
      for (const entry of entries) {
        if (this.isExpired(entry)) {
          await this.deleteBank(entry.bankId);
          continue;
        }
        validEntries.push(entry);
      }

      await this.waitForTransaction(transaction);
      db.close();

      return validEntries;
    } catch (error) {
      console.error('[QuestionBankCache] Failed to load cached banks:', error);
      return [];
    }
  }

  async clearExpiredBanks(): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(this.config.objectStore, 'readwrite');
      const store = transaction.objectStore(this.config.objectStore);
      const request = store.openCursor();

      await new Promise<void>((resolve, reject) => {
        request.onsuccess = () => {
          const cursor = request.result;
          if (!cursor) {
            resolve();
            return;
          }

          const entry = cursor.value as QuestionBankCacheEntry;
          if (this.isExpired(entry)) {
            cursor.delete();
          }
          cursor.continue();
        };

        request.onerror = () => reject(request.error);
      });

      await this.waitForTransaction(transaction);
      db.close();
      console.log('[QuestionBankCache] Cleared expired banks.');
    } catch (error) {
      console.error('[QuestionBankCache] Failed to clear expired banks:', error);
      throw error;
    }
  }

  private async deleteBank(bankId: string): Promise<void> {
    try {
      const db = await this.openDatabase();
      const transaction = db.transaction(this.config.objectStore, 'readwrite');
      const store = transaction.objectStore(this.config.objectStore);
      store.delete(bankId);
      await this.waitForTransaction(transaction);
      db.close();
    } catch (error) {
      console.error('[QuestionBankCache] Failed to delete expired bank:', error);
      throw error;
    }
  }
}
