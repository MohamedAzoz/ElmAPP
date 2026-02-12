import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Theme { 
  isDarkMode = signal(false);

  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());
    const element = document.querySelector('html');
    if (this.isDarkMode()) {
      element?.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      element?.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }

  // استدعاء هذه الدالة عند تشغيل التطبيق (app.component.ts)
  loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      this.isDarkMode.set(true);
      document.querySelector('html')?.classList.add('dark');
    }
  }

}
