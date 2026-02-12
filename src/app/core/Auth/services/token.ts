import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Token {
  get accessToken() {
    return localStorage.getItem('access_token');
  }

  setTokens({ access, expires_on }: { access: string; expires_on: string }) {
    localStorage.setItem('access_token', access);
    localStorage.setItem('expires_on', expires_on);
  }

  setValue(key: string, value: string) {
    localStorage.setItem(key, value);
  }

  clear() {
    localStorage.clear();
  }
}
