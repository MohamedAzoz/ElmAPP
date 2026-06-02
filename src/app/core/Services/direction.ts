import { Injectable, signal, effect, inject } from '@angular/core';
import { LocalStorage } from './local-storage';

@Injectable({
  providedIn: 'root',
})
export class DirectionService {
  private localStorage = inject(LocalStorage);
  private dir = signal<'ltr' | 'rtl'>(this.getInitialDirection());
  readonly currentDir = this.dir.asReadonly();

  constructor() {
    // هذا الـ Effect سيعمل تلقائياً في كل مرة تتغير فيها قيمة الـ Signal
    effect(() => {
      const direction = this.dir();
      // تحديث وسم الـ html مباشرة
      document.documentElement.dir = direction;
      // أو تحديث الـ body إذا كنت تفضل ذلك
      // document.body.dir = direction;
    });
  }

  private getInitialDirection(): 'ltr' | 'rtl' {
    const lang = this.localStorage.get('lang') || 'ar';
    return lang === 'ar' ? 'rtl' : 'ltr';
  }
  
  setDirection(direction: 'ltr' | 'rtl'): void {
    this.localStorage.set('lang', direction === 'rtl' ? 'ar' : 'en');
    this.dir.set(direction);
  }
}
