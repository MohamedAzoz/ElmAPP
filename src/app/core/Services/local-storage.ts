import { inject, Injectable } from '@angular/core';
import { SecureStorageService } from './secure-storage.service';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  private secureStorage = inject(SecureStorageService);

  set(key: string, value: any) {
    this.secureStorage.set(key, value);
  }

  get(key: string) {
    return this.secureStorage.get(key);
  }

  remove(key: string) {
    this.secureStorage.remove(key);
  }

  deleteAllButThis() {
    const keysToKeep = [
      'rate_limit_login_end',
      'rate_limit_login_msg',
      'rate_limit_test_end',
      'rate_limit_test_msg',
      'rate_limit_global_end',
      'rate_limit_global_msg',
      'theme',
      'lang',
      'isDark',
    ];
    const allKeys = this.secureStorage.getKeys();
    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        this.secureStorage.remove(key);
      }
    });
  }

  clear() {
    this.secureStorage.clear();
  }
}
