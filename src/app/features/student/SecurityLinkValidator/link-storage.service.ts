import { inject, Injectable } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { firstValueFrom, catchError, of } from 'rxjs';
import { EncryptionService } from '../../../core/Services/EncryptionService';
import { EncryptedEntry } from '../../../core/AppContext/storage.models';
import { SavedLink, LinkSourceType } from './link.model';

/**
 * خدمة تخزين الروابط المشفرة في IndexedDB
 * تتبع نفس نمط AppDatabase الموجود في المشروع
 */
@Injectable({ providedIn: 'root' })
export class LinkStorageService {
  private readonly STORE_NAME = 'linksStore';
  private readonly LINK_PREFIX = 'link:';

  private readonly encryption = inject(EncryptionService);
  private readonly db = inject(CatbeeIndexedDBService);

  /** حفظ رابط جديد أو تحديث رابط موجود */
  async saveLink(link: SavedLink): Promise<void> {
    await this.writeEncrypted(this.getLinkKey(link.id), link);
  }

  /** جلب رابط واحد بالمعرف */
  async getLinkById(id: string): Promise<SavedLink | null> {
    return this.readEncrypted<SavedLink>(this.getLinkKey(id));
  }

  /** جلب كل الروابط المحفوظة */
  async getAllLinks(): Promise<SavedLink[]> {
    try {
      const allEntries = await firstValueFrom(
        this.db.getAll<EncryptedEntry>(this.STORE_NAME).pipe(
          catchError(() => of([] as EncryptedEntry[])),
        ),
      );

      if (!allEntries?.length) return [];

      const links = await Promise.all(
        allEntries
          .filter((entry) => entry.id.startsWith(this.LINK_PREFIX))
          .map(async (entry) => {
            try {
              return await this.encryption.decrypt<SavedLink>(entry.payload);
            } catch {
              console.error(`Failed to decrypt link entry: ${entry.id}`);
              return null;
            }
          }),
      );

      return links
        .filter((link): link is SavedLink => link !== null)
        .sort((a, b) => b.createdAt - a.createdAt);
    } catch (error) {
      console.error('Failed to load all links:', error);
      return [];
    }
  }

  /** حذف رابط بالمعرف */
  async deleteLink(id: string): Promise<void> {
    try {
      await firstValueFrom(
        this.db.deleteByKey(this.STORE_NAME, this.getLinkKey(id)),
      );
    } catch {
      // تجاهل أخطاء الحذف الصامتة
    }
  }

  /** تحديث رابط موجود */
  async updateLink(link: SavedLink): Promise<void> {
    await this.saveLink(link);
  }

  /** جلب روابط حسب نوع المصدر */
  async getLinksByType(sourceType: LinkSourceType): Promise<SavedLink[]> {
    const allLinks = await this.getAllLinks();
    return allLinks.filter((link) => link.sourceType === sourceType);
  }

  /** حذف جميع الروابط */
  async clearAllLinks(): Promise<void> {
    try {
      const allEntries = await firstValueFrom(
        this.db.getAll<EncryptedEntry>(this.STORE_NAME).pipe(
          catchError(() => of([] as EncryptedEntry[])),
        ),
      );

      if (!allEntries?.length) return;

      const linkKeys = allEntries
        .filter((entry) => entry.id.startsWith(this.LINK_PREFIX))
        .map((entry) => entry.id);

      await Promise.all(
        linkKeys.map((key) =>
          firstValueFrom(this.db.deleteByKey(this.STORE_NAME, key)),
        ),
      );
    } catch {
      // تجاهل الأخطاء
    }
  }

  /** استيراد روابط من مصفوفة (للمزامنة من Google Drive) */
  async importLinks(links: SavedLink[]): Promise<void> {
    await Promise.all(links.map((link) => this.saveLink(link)));
  }

  /** تصدير كل الروابط كـ JSON string */
  async exportLinksAsJson(): Promise<string> {
    const links = await this.getAllLinks();
    return JSON.stringify(links, null, 2);
  }

  // --- دوال داخلية ---

  private getLinkKey(id: string): string {
    return `${this.LINK_PREFIX}${id}`;
  }

  private async writeEncrypted<T>(id: string, value: T): Promise<void> {
    try {
      const payload = await this.encryption.encrypt(value);
      const entry: EncryptedEntry = {
        id,
        payload,
        updatedAt: Date.now(),
      };
      await firstValueFrom(this.db.update(this.STORE_NAME, entry));
    } catch (error: any) {
      if (error.name === 'InvalidStateError' || error.message?.includes('closing')) {
        console.warn(`DB Write ignored: Connection is closing during [${this.STORE_NAME}:${id}]`);
        return;
      }
      throw error;
    }
  }

  private async readEncrypted<T>(id: string): Promise<T | null> {
    try {
      const entry = await firstValueFrom(
        this.db.getByID<EncryptedEntry>(this.STORE_NAME, id).pipe(
          catchError(() => of(null)),
        ),
      );

      if (!entry || !entry.payload) return null;

      return await this.encryption.decrypt<T>(entry.payload);
    } catch (error) {
      console.error(`DB Read Error [${this.STORE_NAME}:${id}]:`, error);
      return null;
    }
  }
}
