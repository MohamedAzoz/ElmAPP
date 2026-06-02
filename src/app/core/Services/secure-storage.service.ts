import { Injectable, inject } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { firstValueFrom, catchError, of } from 'rxjs';
import { EncryptionService } from './EncryptionService';

@Injectable({
  providedIn: 'root',
})
export class SecureStorageService {
  private cache = new Map<string, any>();
  private dbService = inject(CatbeeIndexedDBService);
  private encryption = inject(EncryptionService);
  private readonly PREFIX = 'elm:';

  async init() {
    try {
      const items: any = await firstValueFrom(
        this.dbService.getAll('authStore').pipe(catchError(() => of([]))),
      );
      if ((!items || items.length === 0) && window.localStorage.length > 0) {
        // ⚠️ لا ننقل بيانات المصادقة القديمة لمنع دخول token منتهي الصلاحية
        const authKeysToSkip = [
          'access_token', 'fullName', 'role',
          'userId', 'expires_on',
        ];
        for (let i = 0; i < window.localStorage.length; i++) {
          const k = window.localStorage.key(i);
          if (k && !authKeysToSkip.includes(k)) {
            const rawVal = window.localStorage.getItem(k);
            let parsedVal: any = rawVal;
            try {
              if (rawVal) {
                parsedVal = JSON.parse(rawVal);
              }
            } catch (e) {}
            this.set(k, parsedVal); // This will save to map and encrypt to DB
          }
        }
        return;
      }

      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.id && item.id.startsWith(this.PREFIX) && item.payload) {
            try {
              const decryptedVal = await this.encryption.decrypt(item.payload);
              const originalKey = item.id.replace(this.PREFIX, '');
              this.cache.set(originalKey, decryptedVal);
            } catch (e) {
              console.error(`Failed to decrypt item ${item.id}`, e);
              this.dbService.deleteByKey('authStore', item.id).subscribe();
            }
          }
        }
      }
    } catch (e) {
      console.error('Failed to load data from IndexedDB', e);
    }
  }

  async set(key: string, value: any) {
    this.cache.set(key, value);
    try {
      const payload = await this.encryption.encrypt(value);
      const id = `${this.PREFIX}${key}`;

      this.dbService.update('authStore', { id, payload, updatedAt: Date.now() }).subscribe({
        error: (e) => console.error('IndexedDB update error', e),
      });
    } catch (error) {
      console.error('Encryption error', error);
    }
  }

  get(key: string) {
    return this.cache.has(key) ? this.cache.get(key) : null;
  }

  remove(key: string) {
    this.cache.delete(key);
    const id = `${this.PREFIX}${key}`;
    this.dbService.deleteByKey('authStore', id).subscribe({
      error: (e) => console.error('IndexedDB delete error', e),
    });
  }

  clear() {
    for (const key of this.cache.keys()) {
      this.remove(key);
    }
    this.cache.clear();
  }

  has(key: string) {
    return this.cache.has(key);
  }

  getKeys(): string[] {
    return Array.from(this.cache.keys());
  }
}
