import { effect, inject, Injectable, OnDestroy, signal } from '@angular/core';
import { AppDatabase } from './core/AppContext/app-database';
import { ThemePreference } from './core/AppContext/storage.models';

// ─── Configuration ────────────────────────────────────────────────────────────
const NIGHT_START   = 20;                  // 8 PM  — dark mode begins
const NIGHT_END     = 6;                   // 6 AM  — dark mode ends
const MANUAL_DB_KEY = 'theme:manual-date'; // settingsStore key (legacy prefix added by AppDatabase)

// ─────────────────────────────────────────────────────────────────────────────
/**
 * Theme Service — وضع ليلي/نهاري تلقائي حسب الوقت
 *
 * السيناريو الكامل:
 * ─────────────────
 *  1. bootstrap: يقرأ DB بالتوازي — إذا كان هناك override يدوي من اليوم يُطبّقه،
 *     وإلا يحسب الثيم من الساعة الحالية.
 *
 *  2. timer (كل دقيقة):
 *     - يُحدّث الـ label (HH:mm — 🌙/☀️)
 *     - إذا تغيّر اليوم: يمسح الـ override اليدوي ويعود للأوتوماتيك
 *     - في وضع auto: يعيد حساب الثيم من الساعة
 *
 *  3. toggleTheme(): يُغير الثيم يدوياً ويحفظ تاريخ اليوم في DB
 *     (المشكلة في الكود الأصلي: لم يكن يحفظ التاريخ → يضيع عند refresh)
 *
 *  4. enableAutoMode(): يمسح الـ override من DB والـ memory
 *
 *  5. effect في constructor: يُطبّق .dark على <html> ويحفظ الثيم في DB
 *
 *  6. theme-ready class: تُفعّل الـ CSS transitions بعد أول render (يمنع FOUC)
 *
 * التوافق: Angular 20 zoneless · PrimeNG (darkModeSelector: '.dark') · Tailwind v4
 */
@Injectable({ providedIn: 'root' })
export class Theme implements OnDestroy {

  private readonly db = inject(AppDatabase);

  // ── Public Signals ────────────────────────────────────────────────────────
  /** الثيم الحالي */
  readonly isDark = signal<boolean>(false);

  /** true = تلقائي حسب الوقت | false = يدوي لليوم */
  readonly isAutoMode = signal<boolean>(true);

  /** نص للعرض في الـ UI: "14:30 — ☀️ نهاري" */
  readonly currentTimeLabel = signal<string>('');

  // ── Private State ─────────────────────────────────────────────────────────
  private initialized       = false;
  private initPromise       : Promise<void> | null = null;
  private timerHandle       : ReturnType<typeof setInterval> | null = null;
  private manualOverrideDate: string | null = null;

  // ─────────────────────────────────────────────────────────────────────────
  constructor() {
    /**
     * Effect — يعمل فور تغيير isDark:
     *  1. يُبدّل class .dark على <html>  ← يُفعّل Tailwind + PrimeNG dark mode
     *  2. يحفظ الثيم في IndexedDB       ← بعد التهيئة فقط، لا أثناءها
     */
    effect(() => {
      const dark = this.isDark();
      document.documentElement.classList.toggle('dark', dark);

      if (this.initialized) {
        const pref: ThemePreference = dark ? 'dark' : 'light';
        void this.db.saveThemePreference(pref);
      }
    });
  }

  // ─── Public API ───────────────────────────────────────────────────────────

  /**
   * يُستدعى مرة واحدة تلقائياً عبر provideAppInitializer.
   * Idempotent: إعادة الاستدعاء تُعيد نفس الـ Promise.
   */
  async init(): Promise<void> {
    this.initPromise ??= this.bootstrap();
    return this.initPromise;
  }

  loadTheme(): void {
    void this.init();
  }
  /**
   * تبديل يدوي بين الوضع الليلي والنهاري.
   * يُقفل الاختيار لبقية اليوم فقط — الغد يعود تلقائياً.
   *
   * FIX: يحفظ تاريخ الـ override في DB → يبقى بعد page refresh
   */
  toggleTheme(): void {
    this.isAutoMode.set(false);
    this.manualOverrideDate = this.todayKey();
    this.isDark.update(d => !d);

    // حفظ التاريخ في DB (الـ effect يحفظ الثيم تلقائياً)
    void this.db.setLegacyValue(MANUAL_DB_KEY, this.manualOverrideDate);
  }

  /**
   * إعادة تفعيل الوضع التلقائي فوراً.
   *
   * FIX: يحذف الـ override من DB (الكود الأصلي لم يكن يفعل ذلك)
   */
  enableAutoMode(): void {
    this.isAutoMode.set(true);
    this.manualOverrideDate = null;
    void this.db.deleteLegacyValue(MANUAL_DB_KEY); // ← الإصلاح الأساسي
    this.applyTimeBasedTheme();
  }

  /**
   * إعادة ضبط كاملة — يمسح DB ويعود للوضع الافتراضي.
   *
   * FIX: يحذف manual key + يُشغّل الـ await بالتوازي
   */
  async resetToDefaultTheme(): Promise<void> {
    this.stopTimer();
    this.initialized        = false;
    this.manualOverrideDate = null;
    this.isAutoMode.set(true);
    this.isDark.set(false);

    await Promise.all([
      this.db.clearThemePreference(),
      this.db.deleteLegacyValue(MANUAL_DB_KEY),
    ]);

    this.initialized = true;
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  // ─── Bootstrap ────────────────────────────────────────────────────────────

  private async bootstrap(): Promise<void> {
    // قراءة DB بالتوازي — أسرع من sequential awaits
    const [savedTheme, savedDate] = await Promise.all([
      this.db.getThemePreference(),
      this.db.getLegacyValue(MANUAL_DB_KEY),
    ]);

    if (savedDate === this.todayKey() && savedTheme) {
      // override يدوي من اليوم → احترامه
      this.isAutoMode.set(false);
      this.manualOverrideDate = savedDate;
      this.isDark.set(savedTheme === 'dark');
    } else {
      // لا override صالح → حساب من الساعة
      this.applyTimeBasedTheme();
    }

    this.initialized = true;
    this.updateTimeLabel();
    this.startTimer();

    // تفعيل CSS transitions بعد أول render — يمنع FOUC
    // (double rAF يضمن أن الـ paint الأول اكتمل)
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        document.documentElement.classList.add('theme-ready')
      )
    );
  }

  // ─── Time Logic ───────────────────────────────────────────────────────────

  /** يحسب الثيم من ساعة الجهاز ويُطبّقه */
  private applyTimeBasedTheme(): void {
    const h = new Date().getHours();
    this.isDark.set(h >= NIGHT_START || h < NIGHT_END);
  }

  /** يُحدّث الـ label المعروض في الـ UI */
  private updateTimeLabel(): void {
    const now  = new Date();
    const hh   = now.getHours()  .toString().padStart(2, '0');
    const mm   = now.getMinutes().toString().padStart(2, '0');
    const icon = this.isDark() ? '🌙 ليلي' : '☀️ نهاري';
    this.currentTimeLabel.set(`${hh}:${mm} — ${icon}`);
  }

  // ─── Timer ────────────────────────────────────────────────────────────────

  /** يبدأ التايمر مُزامناً مع أول دقيقة كاملة */
  private startTimer(): void {
    this.stopTimer();
    const now   = new Date();
    const delay = (60 - now.getSeconds()) * 1_000 - now.getMilliseconds();

    setTimeout(() => {
      this.tick();
      this.timerHandle = setInterval(() => this.tick(), 60_000);
    }, delay);
  }

  /** يُستدعى كل دقيقة */
  private tick(): void {
    this.updateTimeLabel();

    // تغيّر اليوم؟ → إلغاء الـ override اليدوي تلقائياً
    if (this.manualOverrideDate && this.manualOverrideDate !== this.todayKey()) {
      this.manualOverrideDate = null;
      this.isAutoMode.set(true);
      void this.db.deleteLegacyValue(MANUAL_DB_KEY);
    }

    // في وضع auto → إعادة حساب الثيم من الساعة
    if (this.isAutoMode()) {
      this.applyTimeBasedTheme();
    }
  }

  private stopTimer(): void {
    if (this.timerHandle !== null) {
      clearInterval(this.timerHandle);
      this.timerHandle = null;
    }
  }

  // ─── Utilities ────────────────────────────────────────────────────────────

  /** مفتاح اليوم الحالي: YYYY-MM-DD */
  private todayKey(): string {
    return new Date().toISOString().slice(0, 10);
  }
}