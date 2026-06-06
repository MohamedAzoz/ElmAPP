import { inject, Injectable } from '@angular/core';
import { AuthFacade } from './auth-facade';
import { RoleDto } from '../../api/clients';
import { LocalStorage } from '../../Services/local-storage';

@Injectable({
  providedIn: 'root',
})
export class IdentitySignals {
  private authFacade = inject(AuthFacade);
  private localStorage = inject(LocalStorage);

  get userData() {
    return this.authFacade.userDataStore();
  }

  get isAuthenticated(): boolean {
    const token = this.token;
    if (!token) return false;

    // 💡 إصلاح طريقة التحقق من التواريخ لمنع خطأ Invalid Date
    const expString = this.expiresOn;
    if (!expString) return false;

    const expiresOn = new Date(expString);
    // إذا كان التاريخ غير صالح أو منتهي
    if (isNaN(expiresOn.getTime()) || expiresOn <= new Date()) {
      return false;
    }
    return true; // طالما التوكن موجود والتاريخ لم ينتهِ، فهو مسجل دخول
  }

  get fullName() {
    return this.userData?.fullName ?? this.localStorage.get('fullName') ?? '';
  }

  get roles(): string {
    const _ = this.userData; // Register reactive dependency on userData signal
    try {
      const rolesStr = this.localStorage.get('role');
      return rolesStr || '';
    } catch {
      return "";
    } 
  }

  hasRole(name: string): boolean {
    return this.roles === name;
  }

  get token() {
    return this.userData?.token ?? this.localStorage.get('access_token') ?? '';
  }

  get expiresOn() {
    const _ = this.userData; // Register reactive dependency on userData signal
    return this.localStorage.get('expires_on') ?? '';
  }
}
