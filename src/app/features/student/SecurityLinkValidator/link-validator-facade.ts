import { computed, inject, Injectable, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { ResultOfLinkValidationResult, SecurityClient } from '../../../core/api/clients';
import { AppMessageService } from '../../../core/Services/app-message-service';
import { LinkStorageService } from './link-storage.service';
import { GoogleDriveSyncService, DriveConnectionStatus } from './google-drive-sync.service';
import { SavedLink, LinkSourceType, generateLinkId, LinkStatus } from './link.model';
import { HttpClient, HttpContext } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';
import { SkipLoading } from '../../../core/Interceptors/loading-interceptor';

/**
 * واجهة موحدة لنظام حفظ الروابط الآمنة
 * تنسق بين: التحقق من الأمان + التخزين المحلي + المزامنة مع Drive
 */
@Injectable({ providedIn: 'root' })
export class LinkValidatorFacade {
  private readonly http = inject(HttpClient);
  private readonly messageService = inject(AppMessageService);
  private readonly linkStorage = inject(LinkStorageService);
  private readonly driveSync = inject(GoogleDriveSyncService);

  // api/Security/validateLink
  validateLink(url: string): Observable<ResultOfLinkValidationResult> {
    return this.http.post<any>(
      `${environment.apiUrl}api/Security/validateLink`,
      { url },
      { context: new HttpContext().set(SkipLoading, true) },
    );
  }

  // --- الحالة المركزية ---
  private readonly _links = signal<SavedLink[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isValidating = signal(false);
  private readonly _isSyncing = signal(false);
  private readonly _driveStatus = signal<DriveConnectionStatus>('disconnected');
  private readonly _searchQuery = signal('');
  private readonly _activeFilter = signal<LinkSourceType | 'all'>('all');
  private readonly _validationError = signal<string | null>(null);

  // --- الحالة العامة (read-only) ---
  readonly validationError = this._validationError.asReadonly();

  readonly links = computed(() => {
    let result = this._links();
    const query = this._searchQuery().toLowerCase().trim();
    const filter = this._activeFilter();

    if (filter !== 'all') {
      result = result.filter((link) => link.sourceType === filter);
    }

    if (query) {
      result = result.filter(
        (link) =>
          link.title.toLowerCase().includes(query) || link.url.toLowerCase().includes(query),
      );
    }

    return result;
  });

  readonly isLoading = this._isLoading.asReadonly();
  readonly isValidating = this._isValidating.asReadonly();
  readonly isSyncing = this._isSyncing.asReadonly();
  readonly driveStatus = this._driveStatus.asReadonly();
  readonly searchQuery = this._searchQuery.asReadonly();
  readonly activeFilter = this._activeFilter.asReadonly();
  readonly totalCount = computed(() => this._links().length);

  readonly statusCounts = computed(() => {
    const all = this._links();
    return {
      safe: all.filter((l) => l.status === 'safe').length,
      suspicious: all.filter((l) => l.status === 'suspicious').length,
      pending: all.filter((l) => l.status === 'pending').length,
      error: all.filter((l) => l.status === 'error').length,
    };
  });

  // --- تحميل الروابط ---

  /** تحميل الروابط من IndexedDB */
  async loadLinks(): Promise<void> {
    this._isLoading.set(true);
    try {
      const links = await this.linkStorage.getAllLinks();
      this._links.set(links);
    } catch (error) {
      console.error('Failed to load links:', error);
      this.messageService.addErrorMessage('فشل تحميل الروابط المحفوظة');
    } finally {
      this._isLoading.set(false);
    }
  }

  // --- إضافة رابط جديد ---

  /**
   * إضافة رابط جديد مع التحقق من الأمان
   * 1. التحقق عبر SecurityClient.validate
   * 2. منع الحفظ تماماً إذا كان الرابط غير آمن (400 / 422)
   * 3. حفظ في IndexedDB مشفر ومزامنة مع Google Drive إذا كان آمناً فقط
   */
  clearValidationError(): void {
    this._validationError.set(null);
  }

  // --- إضافة رابط جديد ---

  /**
   * إضافة رابط جديد مع التحقق من الأمان
   * 1. التحقق عبر SecurityClient.validate
   * 2. منع الحفظ تماماً إذا كان الرابط غير آمن (400 / 422)
   * 3. حفظ في IndexedDB مشفر ومزامنة مع Google Drive إذا كان آمناً فقط
   */
  async addLink(title: string, url: string, sourceType: LinkSourceType): Promise<boolean> {
    this._validationError.set(null);

    // التحقق من عدم التكرار
    const existing = this._links().find((l) => l.url === url);
    if (existing) {
      this._validationError.set('هذا الرابط محفوظ مسبقاً في القائمة');
      return false;
    }

    this._isValidating.set(true);

    // إنشاء الرابط بحالة pending مؤقتاً للفحص
    const newLink: SavedLink = {
      id: generateLinkId(),
      title: title.trim(),
      url: url.trim(),
      sourceType,
      status: LinkStatus.pending,
      checkedAt: Date.now(),
      createdAt: Date.now(),
    };

    try {
      // الخطوة 1: التحقق من الأمان عبر الباك إند
      const result = await firstValueFrom(this.validateLink(newLink.url));
      if (result.data?.isSafe) {
        newLink.status = LinkStatus.safe;
        newLink.checkedAt = Date.now();
      } else {
        this._isValidating.set(false);
        const backendMessage =
          result.data?.description ||
          result.data?.threatType ||
          result?.errors?.at(0)?.errorMessage ||
          result?.message ||
          'تحذير: هذا الرابط غير آمن أو غير متوفر حالياً ولا يمكن حفظه ⚠️';
        this._validationError.set(backendMessage);
        return false;
      }
    } catch (error: any) {
      this._isValidating.set(false);
      const statusCode = error?.status;

      if (statusCode === 400 || statusCode === 422) {
        const backendMessage =
          error?.error?.message ||
          error?.message ||
          'عذراً، هذا الرابط غير آمن أو غير متوفر ولا يمكن حفظه في المنصة ⚠️';
        this._validationError.set(backendMessage);
        return false;
      } else {
        this._validationError.set(
          'فشل الاتصال بسيرفر فحص الأمان حالياً، يرجى التحقق من الشبكة وإعادة المحاولة.',
        );
        return false;
      }
    }

    this._isValidating.set(false);

    // الخطوة 2: حفظ في IndexedDB (يصل هنا فقط إذا كان الرابط سليماً وآمناً 100%)
    try {
      await this.linkStorage.saveLink(newLink);
      this._links.update((prev) => [newLink, ...prev]);
      this.messageService.addSuccessMessage('تم حفظ الرابط بنجاح ✅');
    } catch {
      this.messageService.addErrorMessage('فشل حفظ الرابط في التخزين المحلي');
      return false;
    }

    // الخطوة 3: مزامنة مع Google Drive (بدون حجب)
    this.syncToDriveQuietly();

    return true;
  }

  // --- حذف رابط ---

  async deleteLink(id: string): Promise<void> {
    try {
      await this.linkStorage.deleteLink(id);
      this._links.update((prev) => prev.filter((l) => l.id !== id));
      this.messageService.addSuccessMessage('تم حذف الرابط بنجاح');
      this.syncToDriveQuietly();
    } catch {
      this.messageService.addErrorMessage('فشل حذف الرابط');
    }
  }

  // --- إعادة فحص رابط ---

  async recheckLink(id: string): Promise<void> {
    const link = this._links().find((l) => l.id === id);
    if (!link) return;

    const updated: SavedLink = { ...link, status: LinkStatus.pending };
    this._links.update((prev) => prev.map((l) => (l.id === id ? updated : l)));

    try {
      let result = await firstValueFrom(this.validateLink(link.url));
      if (result.data?.isSafe) updated.status = LinkStatus.safe;
      else {
        this._isValidating.set(false);
        const backendMessage =
          result?.errors?.at(0)?.errorMessage ||
          'تحذير: هذا الرابط أصبح غير آمن أو غير متوفر حالياً ⚠️';
        this.messageService.addWarnMessage(backendMessage);
      }
      updated.checkedAt = Date.now();
      this.messageService.addSuccessMessage('الرابط آمن ومتاح ✅');
    } catch (error: any) {
      if (error?.status === 400 || error?.status === 422) {
        updated.status = LinkStatus.suspicious;
        const backendMessage =
          error?.error?.message || 'تحذير: هذا الرابط أصبح غير آمن أو غير متوفر حالياً ⚠️';
        this.messageService.addWarnMessage(backendMessage);
      } else {
        updated.status = LinkStatus.error;
        this.messageService.addErrorMessage('فشل إعادة الفحص، يرجى المحاولة لاحقاً');
      }
    }

    this._links.update((prev) => prev.map((l) => (l.id === id ? updated : l)));
    await this.linkStorage.updateLink(updated);
    this.syncToDriveQuietly();
  }

  // --- تحديث رابط ---

  async updateLink(
    id: string,
    title: string,
    url: string,
    sourceType: LinkSourceType,
  ): Promise<boolean> {
    this._validationError.set(null);
    const link = this._links().find((l) => l.id === id);
    if (!link) return false;

    const urlChanged = link.url !== url.trim();

    const updated: SavedLink = {
      ...link,
      title: title.trim(),
      url: url.trim(),
      sourceType,
    };

    // إعادة التحقق إذا تغير الرابط فعلياً
    if (urlChanged) {
      this._isValidating.set(true);
      try {
        let result = await firstValueFrom(this.validateLink(updated.url));
        if (result.data?.isSafe) {
          updated.status = LinkStatus.safe;
          updated.checkedAt = Date.now();
        } else {
          this._isValidating.set(false);
          const backendMessage =
            result.data?.description ||
            result.data?.threatType ||
            result?.errors?.at(0)?.errorMessage ||
            result?.message ||
            'تحذير: هذا الرابط غير آمن أو غير متوفر حالياً ولا يمكن حفظه ⚠️';
          this._validationError.set(backendMessage);
          return false;
        }
      } catch (error: any) {
        this._isValidating.set(false);
        const statusCode = error?.status;
        if (statusCode === 400 || statusCode === 422) {
          const backendMessage =
            error?.error?.message ||
            error?.message ||
            'عذراً، الرابط الجديد غير آمن أو غير متوفر ولا يمكن حفظه ⚠️';
          this._validationError.set(backendMessage);
          return false;
        } else {
          this._validationError.set('فشل الاتصال بسيرفر فحص الأمان حالياً، يرجى المحاولة لاحقاً.');
          return false;
        }
      }
      this._isValidating.set(false);
    }

    try {
      await this.linkStorage.updateLink(updated);
      this._links.update((prev) => prev.map((l) => (l.id === id ? updated : l)));
      this.messageService.addSuccessMessage('تم تحديث الرابط بنجاح');
      this.syncToDriveQuietly();
      return true;
    } catch {
      this.messageService.addErrorMessage('فشل تحديث الرابط');
      return false;
    }
  }

  // --- البحث والفلترة ---

  setSearchQuery(query: string): void {
    this._searchQuery.set(query);
  }

  setActiveFilter(filter: LinkSourceType | 'all'): void {
    this._activeFilter.set(filter);
  }

  // --- Google Drive ---

  /** الاتصال بـ Google Drive */
  async connectToDrive(): Promise<void> {
    this._driveStatus.set('connecting');
    try {
      await this.driveSync.initialize();
      await this.driveSync.authenticate();
      this._driveStatus.set('connected');
      this.messageService.addSuccessMessage('تم الاتصال بـ Google Drive بنجاح');
    } catch (error) {
      this._driveStatus.set('error');
      this.messageService.addErrorMessage('فشل الاتصال بـ Google Drive');
      console.error('Drive connection error:', error);
    }
  }

  /** قطع الاتصال بـ Google Drive */
  disconnectFromDrive(): void {
    this.driveSync.disconnect();
    this._driveStatus.set('disconnected');
    this.messageService.addInfoMessage('تم قطع الاتصال بـ Google Drive');
  }

  /** مزامنة يدوية مع Google Drive */
  async syncToDrive(): Promise<void> {
    if (this._driveStatus() !== 'connected') {
      await this.connectToDrive();
    }

    this._isSyncing.set(true);
    try {
      const allLinks = await this.linkStorage.getAllLinks();
      await this.driveSync.syncLinks(allLinks);
      this.messageService.addSuccessMessage('تمت المزامنة مع Google Drive بنجاح');
    } catch (error) {
      this.messageService.addErrorMessage('فشلت المزامنة مع Google Drive');
      console.error('Sync error:', error);
    } finally {
      this._isSyncing.set(false);
    }
  }

  /** استعادة الروابط من Google Drive */
  async restoreFromDrive(): Promise<void> {
    if (this._driveStatus() !== 'connected') {
      await this.connectToDrive();
    }

    this._isSyncing.set(true);
    try {
      const driveLinks = await this.driveSync.restoreLinks();
      if (driveLinks.length === 0) {
        this.messageService.addInfoMessage('لا توجد روابط محفوظة في Google Drive');
        return;
      }

      await this.linkStorage.importLinks(driveLinks);
      await this.loadLinks();
      this.messageService.addSuccessMessage(`تم استعادة ${driveLinks.length} رابط من Google Drive`);
    } catch (error) {
      this.messageService.addErrorMessage('فشلت استعادة الروابط من Google Drive');
      console.error('Restore error:', error);
    } finally {
      this._isSyncing.set(false);
    }
  }

  // --- دوال داخلية ---

  /** مزامنة صامتة بدون حجب أو رسائل خطأ مزعجة */
  private async syncToDriveQuietly(): Promise<void> {
    if (this._driveStatus() !== 'connected') return;

    this._isSyncing.set(true);
    try {
      const allLinks = await this.linkStorage.getAllLinks();
      await this.driveSync.syncLinks(allLinks);
    } catch (error) {
      console.warn('Silent Drive sync failed:', error);
    } finally {
      this._isSyncing.set(false);
    }
  }
}
