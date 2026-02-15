import { inject, Injectable } from '@angular/core';
import { AuthFacade } from './auth-facade';
import { RoleDto } from '../../api/clients';

@Injectable({
  providedIn: 'root',
})
export class IdentitySignals {
  private authFacade = inject(AuthFacade);

  get userData() {
    return this.authFacade.userDataStore();
  }

  get isAuthenticated(): boolean {
    const token = this.token;
    if (!token) return false;

    // 💡 إصلاح طريقة التحقق من التواريخ لمنع خطأ Invalid Date
    const expString = this.expiresOn;
    if (!expString) return false;
    const refreshTokenExpiration = this.refreshTokenExpiration;
    if (!refreshTokenExpiration) return false;

    const expiresOn = new Date(expString);
    const refreshTokenExpirationDate = new Date(refreshTokenExpiration);
    // إذا كان التاريخ غير صالح أو منتهي
    if (isNaN(expiresOn.getTime()) || expiresOn <= new Date()) {
      return false;
    }
    if (isNaN(refreshTokenExpirationDate.getTime()) || refreshTokenExpirationDate <= new Date()) {
      return false;
    }
    return true; // طالما التوكن موجود والتاريخ لم ينتهِ، فهو مسجل دخول
  }

  get userId() {
    return this.userData?.userId ?? localStorage.getItem('userId') ?? '';
  }

  get userName() {
    return this.userData?.userName ?? localStorage.getItem('userName') ?? '';
  }

  get fullName() {
    return this.userData?.fullName ?? localStorage.getItem('fullName') ?? '';
  }

  get roles(): RoleDto[] {
    try {
      // استخدمنا try-catch لأن قراءة JSON خاطئ توقف التطبيق
      const rolesStr = localStorage.getItem('roles');
      return this.userData?.roles ?? (rolesStr ? JSON.parse(rolesStr) : []);
    } catch {
      return [];
    }
  }

  hasRole(name: string): boolean {
    return this.roles.some((role) => role.name?.toLowerCase() === name.toLowerCase());
  }

  get token() {
    return this.userData?.token ?? localStorage.getItem('access_token') ?? '';
  }

  get expiresOn() {
    return this.userData?.expiresOn ?? localStorage.getItem('expires_on') ?? '';
  }

  get refreshTokenExpiration() {
    return (
      this.userData?.refreshTokenExpiration ?? localStorage.getItem('refreshTokenExpiration') ?? ''
    );
  }
}
