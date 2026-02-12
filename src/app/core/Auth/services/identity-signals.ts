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
    const expiresOn = new Date(this.expiresOn ?? '');
    const isAuth = expiresOn > new Date();
    const refreshTokenExpiration = new Date(this.refreshTokenExpiration ?? '');
    const isRefreshTokenValid = refreshTokenExpiration > new Date();
    return (
      isAuth &&
      isRefreshTokenValid &&
      (this.userData?.isAuthenticated ??
        localStorage.getItem('isAuthenticated')?.toLowerCase() === 'true')
    );
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
    return this.userData?.roles ?? JSON.parse(localStorage.getItem('roles') || '') ?? [];
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
    return this.userData?.refreshTokenExpiration ?? localStorage.getItem('expires_on') ?? '';
  }
}
