import { inject, Injectable } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { firstValueFrom } from 'rxjs';

interface EncryptionKeyEntity {
  id: string;
  key: CryptoKey;
  createdAt: number;
}

@Injectable({ providedIn: 'root' })
export class EncryptionService {
  private readonly KEY_ID = 'main-1x2dsx-key-256-elm';
  private readonly IV_LENGTH = 12;

  private key: CryptoKey | null = null;
  private readonly db = inject(CatbeeIndexedDBService);

  private readonly encoder = new TextEncoder();
  private readonly decoder = new TextDecoder();

  async getKey(): Promise<CryptoKey> {
    if (this.key) {
      return this.key;
    }

    const rawKey = this.encoder.encode(this.KEY_ID);
    const hash = await crypto.subtle.digest('SHA-256', rawKey);

    this.key = await crypto.subtle.importKey(
      'raw',
      hash,
      { name: 'AES-GCM' },
      false,
      ['encrypt', 'decrypt']
    );

    return this.key;
  }

  async encrypt(data: unknown): Promise<string> {
    const key = await this.getKey();
    const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

    const encoded = this.encoder.encode(JSON.stringify(data));

    const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded);

    const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encryptedBuffer), iv.length);

    return this.bytesToBase64(combined);
  }

  async decrypt<T = unknown>(encryptedBase64: string): Promise<T> {
    const key = await this.getKey();
    const combined = this.base64ToBytes(encryptedBase64);

    if (combined.length <= this.IV_LENGTH) {
      throw new Error('Invalid encrypted payload.');
    }

    const iv = combined.slice(0, this.IV_LENGTH);
    const data = combined.slice(this.IV_LENGTH);

    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data);

    return JSON.parse(this.decoder.decode(decryptedBuffer)) as T;
  }

  private bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    const chunkSize = 0x8000;

    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.subarray(i, i + chunkSize);
      binary += String.fromCharCode(...chunk);
    }

    return btoa(binary);
  }

  private base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
  }

  async resetKey(): Promise<void> {
    this.key = null;
    await this.getKey();
  }
}
