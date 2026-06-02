import { effect, inject, Injectable, signal } from '@angular/core';
import { AppDatabase } from './core/AppContext/app-database';
import { ThemePreference } from './core/AppContext/storage.models';

@Injectable({
  providedIn: 'root',
})
export class Theme {
  private readonly appDb = inject(AppDatabase);

  private initialized = false;
  private initPromise: Promise<void> | null = null;
  private readonly forceLightMode = signal<boolean>(false);
  isDark = signal<boolean>(false);

  ngOnInit(): void {
    effect(() => {
      const forceLight = this.forceLightMode();
      if (this.initialized && !forceLight) {
        this.setForceLightMode(true);
        const nextTheme: ThemePreference = this.isDark() ? 'dark' : 'light';
        void this.appDb.saveThemePreference(nextTheme);
      }
    });
  }

  setForceLightMode(enabled: boolean): void {
    this.forceLightMode.set(enabled);
    const html = document.documentElement;
    if (enabled) {
      html.classList.remove('dark');
    } else if (this.isDark()) {
      html.classList.add('dark');
    }
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.hydrateTheme();
    }

    await this.initPromise;
  }

  loadTheme(): void {
    void this.init();
  }

  private async hydrateTheme(): Promise<void> {
    const savedTheme = await this.appDb.getThemePreference();

    if (savedTheme) {
      this.isDark.set(savedTheme === 'dark');
      this.initialized = true;
      return;
    }

    this.isDark.set(false);
    this.initialized = true;
  }

  toggleTheme() {
    this.isDark.update((d) => !d);
  }

  async resetToDefaultTheme(): Promise<void> {
    this.initialized = false;
    this.forceLightMode.set(false);
    this.isDark.set(false);
    await this.appDb.clearThemePreference();
    this.initialized = true;
  }
}
