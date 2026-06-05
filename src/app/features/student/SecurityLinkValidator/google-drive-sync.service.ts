import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { SavedLink } from './link.model';

// Declare google and gapi for TypeScript
declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenClient {
        callback?: (response: TokenResponse) => void;
        requestAccessToken(options?: { prompt?: string }): void;
      }
      interface TokenResponse {
        access_token: string;
        error?: string;
      }
      function initTokenClient(config: any): TokenClient;
      function revoke(token: string, callback: () => void): void;
    }
  }
}
declare var gapi: any;

/** حالات الاتصال بـ Google Drive */
export type DriveConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * خدمة مزامنة الروابط مع Google Drive
 * - تحميل GAPI + GIS بشكل كسول
 * - إنشاء مجلد مخفي .elm_secure_links
 * - حفظ/تحديث ملف secure-links.json
 */
@Injectable({ providedIn: 'root' })
export class GoogleDriveSyncService {
  private readonly FOLDER_NAME = '.elm_secure_links';
  private readonly FILE_NAME = 'secure-links.json';
  private readonly FOLDER_MIME = 'application/vnd.google-apps.folder';
  private readonly JSON_MIME = 'application/json';

  private gapiLoaded = false;
  private gisLoaded = false;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private folderId: string | null = null;
  private fileId: string | null = null;

  /**
   * تهيئة GAPI و GIS
   * يتم استدعاؤها مرة واحدة فقط
   */
  async initialize(): Promise<void> {
    await this.loadGapi();
    await this.loadGis();
  }

  /** التحقق من جاهزية الخدمة */
  get isReady(): boolean {
    return this.gapiLoaded && this.gisLoaded;
  }

  /**
   * المصادقة مع Google وطلب إذن الوصول
   * يعيد Promise يتم حلها عند حصول الـ token
   */
  async authenticate(): Promise<void> {
    if (!this.isReady) {
      await this.initialize();
    }

    return new Promise<void>((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      this.tokenClient.callback = (response: google.accounts.oauth2.TokenResponse) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve();
      };

      // التحقق من وجود token صالح
      if (gapi.client.getToken() === null) {
        // طلب موافقة المستخدم
        this.tokenClient.requestAccessToken({ prompt: 'consent' });
      } else {
        // استخدام token موجود
        this.tokenClient.requestAccessToken({ prompt: '' });
      }
    });
  }

  /** قطع الاتصال وإلغاء الـ token */
  disconnect(): void {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => {});
      gapi.client.setToken(null);
    }
    this.folderId = null;
    this.fileId = null;
  }

  /** التحقق من حالة المصادقة */
  isAuthenticated(): boolean {
    return gapi.client?.getToken() !== null;
  }

  /**
   * مزامنة الروابط مع Google Drive
   * يقوم بإنشاء/تحديث ملف JSON في المجلد المخفي
   */
  async syncLinks(links: SavedLink[]): Promise<void> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
    }

    // التأكد من وجود المجلد
    await this.ensureFolder();

    // تحضير المحتوى
    const content = JSON.stringify(links, null, 2);

    // البحث عن الملف الموجود أو إنشاء جديد
    await this.ensureFile();

    if (this.fileId) {
      // تحديث الملف الموجود
      await this.updateFile(this.fileId, content);
    } else {
      // إنشاء ملف جديد
      this.fileId = await this.createFile(content);
    }
  }

  /**
   * استعادة الروابط من Google Drive
   */
  async restoreLinks(): Promise<SavedLink[]> {
    if (!this.isAuthenticated()) {
      await this.authenticate();
    }

    await this.ensureFolder();
    await this.ensureFile();

    if (!this.fileId) {
      return [];
    }

    try {
      const response = await gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media',
      });

      const data = typeof response.result === 'string'
        ? JSON.parse(response.result)
        : response.result;

      if (Array.isArray(data)) {
        return data as SavedLink[];
      }
      return [];
    } catch (error) {
      console.error('Failed to restore links from Drive:', error);
      return [];
    }
  }

  // --- دوال تحميل GAPI و GIS ---

  private loadGapi(): Promise<void> {
    if (this.gapiLoaded) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const checkGapi = (attempts = 0) => {
        if (typeof gapi !== 'undefined') {
          gapi.load('client', async () => {
            try {
              await gapi.client.init({
                apiKey: environment.googleDrive.apiKey,
                discoveryDocs: environment.googleDrive.discoveryDocs,
              });
              this.gapiLoaded = true;
              resolve();
            } catch (error) {
              reject(error);
            }
          });
        } else if (attempts < 20) {
          setTimeout(() => checkGapi(attempts + 1), 500);
        } else {
          reject(new Error('GAPI script not loaded. Check index.html'));
        }
      };
      checkGapi();
    });
  }

  private loadGis(): Promise<void> {
    if (this.gisLoaded) return Promise.resolve();

    return new Promise<void>((resolve, reject) => {
      const checkGis = (attempts = 0) => {
        if (typeof google !== 'undefined' && google.accounts) {
          try {
            this.tokenClient = google.accounts.oauth2.initTokenClient({
              client_id: environment.googleDrive.clientId,
              scope: environment.googleDrive.scopes,
              callback: () => {},
            });
            this.gisLoaded = true;
            resolve();
          } catch (error) {
            reject(error);
          }
        } else if (attempts < 20) {
          setTimeout(() => checkGis(attempts + 1), 500);
        } else {
          reject(new Error('GIS script not loaded. Check index.html'));
        }
      };
      checkGis();
    });
  }

  // --- دوال إدارة المجلد والملف ---

  /** التأكد من وجود المجلد المخفي أو إنشائه */
  private async ensureFolder(): Promise<void> {
    if (this.folderId) return;

    try {
      // البحث عن المجلد الموجود
      const response = await gapi.client.drive.files.list({
        q: `name='${this.FOLDER_NAME}' and mimeType='${this.FOLDER_MIME}' and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const folders = response.result.files;
      if (folders && folders.length > 0) {
        this.folderId = folders[0].id!;
        return;
      }

      // إنشاء مجلد جديد مع خصائص التطبيق (مخفي)
      const createResponse = await gapi.client.drive.files.create({
        resource: {
          name: this.FOLDER_NAME,
          mimeType: this.FOLDER_MIME,
          appProperties: {
            hidden: 'true',
            app: 'ElmApp',
            purpose: 'secure_links_storage',
          },
        },
        fields: 'id',
      } as any);

      this.folderId = createResponse.result.id!;
    } catch (error) {
      console.error('Failed to ensure Drive folder:', error);
      throw error;
    }
  }

  /** البحث عن ملف الروابط الموجود */
  private async ensureFile(): Promise<void> {
    if (this.fileId) return;

    if (!this.folderId) return;

    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${this.FILE_NAME}' and '${this.folderId}' in parents and trashed=false`,
        fields: 'files(id, name)',
        spaces: 'drive',
      });

      const files = response.result.files;
      if (files && files.length > 0) {
        this.fileId = files[0].id!;
      }
    } catch (error) {
      console.error('Failed to search for file in Drive:', error);
    }
  }

  /** إنشاء ملف JSON جديد في المجلد */
  private async createFile(content: string): Promise<string> {
    const metadata = {
      name: this.FILE_NAME,
      mimeType: this.JSON_MIME,
      parents: [this.folderId!],
      appProperties: {
        encrypted: 'false',
        app: 'ElmApp',
      },
    };

    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: this.JSON_MIME }),
    );
    form.append(
      'file',
      new Blob([content], { type: this.JSON_MIME }),
    );

    const token = gapi.client.getToken();
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
        },
        body: form,
      },
    );

    const result = await response.json();
    return result.id;
  }

  /** تحديث محتوى ملف موجود */
  private async updateFile(fileId: string, content: string): Promise<void> {
    const token = gapi.client.getToken();

    await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': this.JSON_MIME,
        },
        body: content,
      },
    );
  }
}
