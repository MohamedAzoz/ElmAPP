import { effect, inject, Injectable, signal } from '@angular/core';
import { LocalStorage } from './local-storage';

@Injectable({
  providedIn: 'root',
})
export class Language {
  private localStorage = inject(LocalStorage);
  private language = signal<'en' | 'ar'>(this.getCurrentLanguage());
  readonly currentLanguage = this.language.asReadonly();

  constructor() {
    effect(() => {
      const lang = this.language();
      document.documentElement.lang = lang;
    });
  }
  getCurrentLanguage(): 'en' | 'ar' {
    const lang = this.localStorage.get('lang') || 'en';
    return lang === 'ar' ? 'ar' : 'en';
  }
  setLanguage(lang: 'en' | 'ar'): void {
    this.localStorage.set('lang', lang);
    this.language.set(lang);
  }
}
