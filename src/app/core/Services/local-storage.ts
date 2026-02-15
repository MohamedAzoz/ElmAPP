import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LocalStorage {
  set(key: string, value: any) {
    if (Array.isArray(value)) {
      value = JSON.stringify(value);
    }
    localStorage.setItem(key, value);
  }
  get(key: string) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  }
  remove(key: string) {
    localStorage.removeItem(key);
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
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (!keysToKeep.includes(key)) {
        localStorage.removeItem(key);
      }
    });
  }
  clear() {
    localStorage.clear();
  }
}
