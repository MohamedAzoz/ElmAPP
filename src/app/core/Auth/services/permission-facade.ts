import { computed, inject, Injectable, signal } from '@angular/core';
import {
  GetPermissionsDto,
  PermissionDto,
  RolePermissionPublicClient,
  UserPermissionPublicClient,
} from '../../../core/api/clients';
import { finalize } from 'rxjs';
import { LocalStorage } from '../../Services/local-storage';

@Injectable({
  providedIn: 'root',
})
export class PermissionFacade {
  private userPermissionPublic = inject(UserPermissionPublicClient);
  private localStorage = inject(LocalStorage);
  private rolePermissionPublic = inject(RolePermissionPublicClient);

  // --- Signals الحالة (State) ---
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  public rolePermissions = signal<PermissionDto[]>([]);
  public userPermissions = signal<GetPermissionsDto[]>([]);

  // #region  Role Permissions (صلاحيات الأدوار)

  getPermissionsByRoleName(roleName: string) {
    this.isLoading.set(true);
    this.rolePermissionPublic
      .getPermissionsByRoleName(roleName)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.rolePermissions.set(res.data || []),
        error: (err) => this.handleError(err),
      });
  }

  hasPermissionRole(permissionName: string) {
    return this.rolePermissions().some((p) => p.name === permissionName);
  }

  // #endregion

  // #region User Permissions (صلاحيات المستخدمين)

  getPermissionsByUserId(userId: string) {
    this.isLoading.set(true);
    this.userPermissionPublic
      .getPermissionsByUserId(userId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.setPermissions(res.data || []),
        error: (err) => this.handleError(err),
      });
  }
  setPermissions(permissions: GetPermissionsDto[]) {
    this.userPermissions.set(permissions);
    this.localStorage.set('permissions', permissions);
  }
  // داخل PermissionFacade
  // تأكد أن هذا السطر يرجع قيمة الـ signal مباشرة
  Permissions = computed(() => {
    const stored = this.localStorage.get('permissions');
    const fromStore = stored ? (stored as GetPermissionsDto[]) : [];
    return this.userPermissions().length > 0 ? this.userPermissions() : fromStore;
  });

  hasPermission(permissionName: string): boolean {
    return this.Permissions().some(
      (p: GetPermissionsDto) => p.permissionName?.toLowerCase() === permissionName.toLowerCase(),
    );
  }

  // #endregion

  // --- دوال مساعدة لتقليل تكرار الكود (Helper Methods) ---
  private handleError(err: any) {
    const errMsg = err?.error?.message || err?.message || 'حدث خطأ غير متوقع';
    this.error.set(errMsg);
  }
}
