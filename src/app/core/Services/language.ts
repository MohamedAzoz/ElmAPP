import { effect, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Language {
  private language = signal<'en' | 'ar'>(this.getCurrentLanguage());
  readonly currentLanguage = this.language.asReadonly();

  constructor() {
    effect(() => {
      const lang = this.language();
      document.documentElement.lang = lang;
    });
  }
  getCurrentLanguage(): 'en' | 'ar' {
    const lang = localStorage.getItem('lang') || 'en';
    return lang === 'ar' ? 'ar' : 'en';
  }
  setLanguage(lang: 'en' | 'ar'): void {
    localStorage.setItem('lang', lang);
    this.language.set(lang);
  }
}
