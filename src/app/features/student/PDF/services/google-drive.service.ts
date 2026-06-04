import { Injectable, signal, NgZone, inject } from '@angular/core';
import { environment } from '../../../../../environments/environment.development';
import type { DriveFile } from '../pdf-editor-component/models/editor.models';

/* ─── Global type declarations for Google Identity Services ─── */
declare const google: {
  accounts: {
    oauth2: {
      initTokenClient(config: {
        client_id: string;
        scope: string;
        callback: (response: { error?: string; access_token?: string }) => void;
      }): { requestAccessToken(): void };
      revoke(token: string, callback: () => void): void;
    };
  };
};

@Injectable({
  providedIn: 'root',
})
export class GoogleDriveService {
  private readonly zone = inject(NgZone);
  private readonly config = environment.googleDrive;

  /** حالات الحالة (Signals) متوافقة مع Angular v20 */
  isInitialized = signal(false);
  isSignedIn = signal(false);
  isLoading = signal(false);
  error = signal<string | null>(null);

  private tokenClient: { requestAccessToken(): void } | null = null;
  private accessToken: string | null = null;

  /**
   * تهيئة مكتبة GAPI بشكل آمن ومعزول
   */
  async init(): Promise<void> {
    if (this.isInitialized()) return;

    try {
      await this.loadGapiClient();
      
      // تنفيذ التهيئة خارج زون أنجولار لضمان عدم حدوث Loop في الـ Change Detection
      await this.zone.runOutsideAngular(async () => {
        await (gapi.client as any).init({
          apiKey: this.config.apiKey,
          discoveryDocs: this.config.discoveryDocs,
        });
      });

      this.zone.run(() => this.isInitialized.set(true));
    } catch (err) {
      console.error('[GoogleDriveService] Init failed:', err);
      this.zone.run(() => this.error.set('فشل تهيئة Google Drive'));
    }
  }

  /**
   * فتح نافذة موافقة جوجل (OAuth2 Popup) للحصول على الـ Token
   */
  async signIn(): Promise<void> {
    try {
      this.error.set(null);
      if (!this.isInitialized()) {
        await this.init();
      }
      await this.requestAccessToken();
    } catch (err) {
      console.error('[GoogleDriveService] Sign in failed:', err);
      this.zone.run(() => this.error.set('فشل تسجيل الدخول'));
    }
  }

  /** تسجيل الخروج وإلغاء صلاحية التوكن محلياً وعالمياً */
  signOut(): void {
    if (this.accessToken) {
      try {
        google.accounts.oauth2.revoke(this.accessToken, () => {
          this.accessToken = null;
          this.zone.run(() => this.isSignedIn.set(false));
        });
      } catch {
        this.accessToken = null;
        this.zone.run(() => this.isSignedIn.set(false));
      }
    } else {
      this.isSignedIn.set(false);
    }
  }

  /**
   * جلب ملفات الـ PDF فقط الخاصة بالطالب من الدرايف
   */
  async listPdfFiles(pageSize = 20): Promise<DriveFile[]> {
    this.isLoading.set(true);
    try {
      const response = await gapi.client.drive.files.list({
        pageSize,
        fields: 'files(id, name, modifiedTime, iconLink, size, mimeType)',
        q: "mimeType='application/pdf' and trashed=false",
        orderBy: 'modifiedTime desc',
      });

      const files = response.result.files || [];
      return files.map((f: any) => ({
        id: f.id || '',
        name: f.name || '',
        modifiedTime: f.modifiedTime || '',
        iconLink: f.iconLink,
        size: f.size,
        mimeType: f.mimeType,
      }));
    } catch (err) {
      console.error('[GoogleDriveService] List files failed:', err);
      this.zone.run(() => this.error.set('فشل جلب الملفات من Google Drive'));
      return [];
    } finally {
      this.zone.run(() => this.isLoading.set(false));
    }
  }

  /**
   * ميزة جديدة: إنشاء مجلد خاص بالمنصة أو المادة (مثل مجلد "منصة عِلم")
   * @param folderName اسم المجلد المراد إنشاؤه
   * @returns الـ ID الخاص بالمجلد الجديد
   */
  async createFolder(folderName: string): Promise<string | undefined> {
    this.isLoading.set(true);
    try {
      const response = await gapi.client.drive.files.create({
        resource: {
          name: folderName,
          mimeType: 'application/vnd.google-apps.folder',
        },
        fields: 'id',
      });
      return response.result.id;
    } catch (err) {
      console.error('[GoogleDriveService] Create folder failed:', err);
      this.zone.run(() => this.error.set('فشل إنشاء المجلد'));
      throw err;
    } finally {
      this.zone.run(() => this.isLoading.set(false));
    }
  }

  /**
   * تحميل الملف كـ ArrayBuffer نقي عبر الـ Native Fetch لتجنب أخطاء الكونسول والـ Interceptors
   */
  async downloadFile(fileId: string): Promise<ArrayBuffer> {
    this.isLoading.set(true);
    try {
      // استخدام Native Fetch مع تجاوز الـ HttpClient الخاص بأنجولار لمنع الـ Interceptor من إفساد الرابط
      const response = await window.fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      
      return await response.arrayBuffer();
    } catch (err) {
      console.error('[GoogleDriveService] Download failed via Native Fetch:', err);
      this.zone.run(() => this.error.set('فشل تحميل محتوى الملف'));
      throw err;
    } finally {
      this.zone.run(() => this.isLoading.set(false));
    }
  }

  /**
   * رفع ملف PDF جديد (مع إمكانية رفعه داخل مجلد محدد)
   * @param name اسم الملف
   * @param pdfBytes مصفوفة البايتات للملف المعدل
   * @param parentFolderId الـ ID الخاص بالمجلد (اختياري) لوضع الملف داخله مباشرة
   */
  async uploadFile(name: string, pdfBytes: Uint8Array, parentFolderId?: string): Promise<string> {
    this.isLoading.set(true);
    try {
      const metadata: any = {
        name,
        mimeType: 'application/pdf',
      };

      // إذا تم تمرير مجلد أب، نضعه في مصفوفة الـ parents للملف
      if (parentFolderId) {
        metadata.parents = [parentFolderId];
      }

      const form = new FormData();
      form.append(
        'metadata',
        new Blob([JSON.stringify(metadata)], { type: 'application/json' })
      );
      form.append('file', new Blob([pdfBytes as any], { type: 'application/pdf' }));

      const response = await window.fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
          body: form,
        }
      );

      const result = await response.json();
      return result.id;
    } catch (err) {
      console.error('[GoogleDriveService] Upload failed:', err);
      this.zone.run(() => this.error.set('فشل حفظ الملف على الدرايف'));
      throw err;
    } finally {
      this.zone.run(() => this.isLoading.set(false));
    }
  }

  /**
   * تحديث ملف موجود بالفعل (تعديل الـ Content فوق نفس الملف)
   */
  async updateFile(fileId: string, pdfBytes: Uint8Array): Promise<void> {
    this.isLoading.set(true);
    try {
      const pdfBlob = new Blob([pdfBytes as any], { type: 'application/pdf' });
      const response = await window.fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/pdf',
          },
          body: pdfBlob,
        }
      );

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    } catch (err) {
      console.error('[GoogleDriveService] Update failed:', err);
      this.zone.run(() => this.error.set('فشل تحديث التعديلات على الدرايف'));
      throw err;
    } finally {
      this.zone.run(() => this.isLoading.set(false));
    }
  }

  // ─── Private Helpers ──────────────────────────────────────────────

  private loadGapiClient(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof gapi === 'undefined') {
        reject(new Error('GAPI script not found in index.html'));
        return;
      }
      gapi.load('client', () => resolve());
    });
  }

  private requestAccessToken(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (typeof google === 'undefined' || !google.accounts?.oauth2) {
        reject(new Error('Google Identity Services script not found in index.html'));
        return;
      }

      this.tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: this.config.clientId,
        scope: this.config.scopes,
        callback: (tokenResponse) => {
          if (tokenResponse.error) {
            this.zone.run(() => this.error.set('تم إلغاء صلاحية الوصول'));
            reject(new Error(tokenResponse.error));
            return;
          }
          this.accessToken = tokenResponse.access_token || null;
          this.zone.run(() => this.isSignedIn.set(true));
          resolve();
        },
      });

      this.tokenClient.requestAccessToken();
    });
  }
}