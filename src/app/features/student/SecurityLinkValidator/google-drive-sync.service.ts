import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { SavedLink } from './link.model';

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

export type DriveConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

@Injectable({ providedIn: 'root' })
export class GoogleDriveSyncService {
  private readonly FOLDER_NAME = '.elm_secure_links';
  private readonly FILE_NAME   = 'secure-links.json';
  private readonly FOLDER_MIME = 'application/vnd.google-apps.folder';
  private readonly JSON_MIME   = 'application/json';

  private gapiLoaded  = false;
  private gisLoaded   = false;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private folderId: string | null = null;
  private fileId: string | null   = null;

  async initialize(): Promise<void> {
    await this.loadGapi();
    await this.loadGis();
  }

  get isReady(): boolean {
    return this.gapiLoaded && this.gisLoaded;
  }

  async authenticate(): Promise<void> {
    if (!this.isReady) await this.initialize();

    return new Promise<void>((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error('Token client not initialized'));
        return;
      }

      this.tokenClient.callback = (response) => {
        if (response.error) { reject(new Error(response.error)); return; }
        resolve();
      };

      const hasToken = gapi.client.getToken() !== null;
      this.tokenClient.requestAccessToken({ prompt: hasToken ? '' : 'consent' });
    });
  }

  disconnect(): void {
    const token = gapi.client.getToken();
    if (token !== null) {
      google.accounts.oauth2.revoke(token.access_token, () => {});
      gapi.client.setToken(null);
    }
    this.folderId = null;
    this.fileId   = null;
  }

  isAuthenticated(): boolean {
    return gapi.client?.getToken() !== null;
  }

  async syncLinks(links: SavedLink[]): Promise<void> {
    if (!this.isAuthenticated()) await this.authenticate();

    // ننتظر المجلد أولاً قبل أي حاجة
    await this.ensureFolder();

    const content = JSON.stringify(links, null, 2);

    // بعد ما المجلد جاهز نبحث عن الملف
    await this.ensureFile();

    if (this.fileId) {
      await this.updateFile(this.fileId, content);
    } else {
      // إنشاء الملف وحفظ الـ id فوراً
      this.fileId = await this.createFile(content);
    }
  }

  async restoreLinks(): Promise<SavedLink[]> {
    if (!this.isAuthenticated()) await this.authenticate();

    await this.ensureFolder();
    await this.ensureFile();

    if (!this.fileId) return [];

    try {
      const response = await gapi.client.drive.files.get({
        fileId: this.fileId,
        alt: 'media',
      });

      const data = typeof response.result === 'string'
        ? JSON.parse(response.result)
        : response.result;

      return Array.isArray(data) ? (data as SavedLink[]) : [];
    } catch (error) {
      console.error('Failed to restore links from Drive:', error);
      return [];
    }
  }

  // ─── تحميل GAPI و GIS ───────────────────────────────────────────────────

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
            } catch (error) { reject(error); }
          });
        } else if (attempts < 20) {
          setTimeout(() => checkGapi(attempts + 1), 500);
        } else {
          reject(new Error('GAPI script not loaded'));
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
          } catch (error) { reject(error); }
        } else if (attempts < 20) {
          setTimeout(() => checkGis(attempts + 1), 500);
        } else {
          reject(new Error('GIS script not loaded'));
        }
      };
      checkGis();
    });
  }

  // ─── إدارة المجلد والملف ────────────────────────────────────────────────

  private async ensureFolder(): Promise<void> {
    if (this.folderId) return;

    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${this.FOLDER_NAME}' and mimeType='${this.FOLDER_MIME}' and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive',
      });

      const folders = response.result.files as { id: string }[] | undefined;

      if (folders && folders.length > 0) {
        this.folderId = folders[0].id;
        return;
      }

      // ─── FIX: إنشاء المجلد بـ multipart لضمان ظهوره في Drive ───────────
      const metadata = {
        name: this.FOLDER_NAME,
        mimeType: this.FOLDER_MIME,
      };

      const token = gapi.client.getToken();
      const res = await fetch(
        'https://www.googleapis.com/drive/v3/files?fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(metadata),
        }
      );

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`Failed to create folder: ${err}`);
      }

      const result = await res.json();
      this.folderId = result.id;
      console.log('[DriveSync] Folder created:', this.folderId);

    } catch (error) {
      console.error('Failed to ensure Drive folder:', error);
      throw error;
    }
  }

  private async ensureFile(): Promise<void> {
    // لو عندنا fileId خلاص، أو لو مفيش folderId اتنشئ بعد
    if (this.fileId)   return;
    if (!this.folderId) return;

    try {
      const response = await gapi.client.drive.files.list({
        q: `name='${this.FILE_NAME}' and '${this.folderId}' in parents and trashed=false`,
        fields: 'files(id)',
        spaces: 'drive',
      });

      const files = response.result.files as { id: string }[] | undefined;
      if (files && files.length > 0) {
        this.fileId = files[0].id;
        console.log('[DriveSync] File found:', this.fileId);
      }
      // لو مش موجود → fileId يفضل null وهيتنشأ في syncLinks
    } catch (error) {
      console.error('Failed to search for file in Drive:', error);
    }
  }

  // ─── FIX: createFile بـ multipart upload صح ─────────────────────────────
  private async createFile(content: string): Promise<string> {
    if (!this.folderId) throw new Error('folderId is null — ensureFolder must run first');

    const metadata = {
      name: this.FILE_NAME,
      mimeType: this.JSON_MIME,
      parents: [this.folderId],          // ← ربط الملف بالمجلد هنا
    };

    const boundary = 'elm_drive_boundary_' + Date.now();

    // multipart body يضم metadata + content في request واحد
    const body = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${this.JSON_MIME}`,
      '',
      content,
      `--${boundary}--`,
    ].join('\r\n');

    const token = gapi.client.getToken();
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to create file in Drive: ${err}`);
    }

    const result = await response.json();
    console.log('[DriveSync] File created:', result.id, 'in folder:', this.folderId);
    return result.id;
  }

  private async updateFile(fileId: string, content: string): Promise<void> {
    const token = gapi.client.getToken();

    const response = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token.access_token}`,
          'Content-Type': this.JSON_MIME,
        },
        body: content,
      }
    );

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Failed to update file in Drive: ${err}`);
    }
  }
}