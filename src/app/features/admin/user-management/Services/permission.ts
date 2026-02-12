import { inject, Injectable, signal } from '@angular/core';
import {
  AddPermissionCommand,
  AddRolePermissionCommand,
  AddUserPermissionCommand,
  DeleteRolePermissionCommand,
  DeleteUserPermissionCommand,
  GetPermissionsDto,
  PermissionAdminClient,
  PermissionDto,
  RolePermissionAdminClient,
  RolePermissionPublicClient,
  UpdatePermissionCommand,
  UserPermissionAdminClient,
  UserPermissionPublicClient,
} from '../../../../core/api/clients';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Permission {
  private permissionAdmin = inject(PermissionAdminClient);
  private rolePermissionAdmin = inject(RolePermissionAdminClient);
  private userPermissionAdmin = inject(UserPermissionAdminClient);
  private userPermissionPublic = inject(UserPermissionPublicClient);
  private rolePermissionPublic = inject(RolePermissionPublicClient);

  // --- Signals الحالة (State) ---
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  // مخازن البيانات (Data Stores) باستخدام Signals
  public permissions = signal<PermissionDto[]>([]);
  public rolePermissions = signal<PermissionDto[]>([]);
  public userPermissions = signal<GetPermissionsDto[]>([]);

  // #region 1. Permissions (الصلاحيات العامة)

  getAllPermissions() {
    this.isLoading.set(true);
    this.permissionAdmin
      .getAllPermissions()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.permissions.set(res.data || []),
        error: (err) => this.handleError(err),
      });
  }

  addPermission(permissionDto: AddPermissionCommand, onSuccess?: () => void) {
    this.executeAction(this.permissionAdmin.addPermission(permissionDto), onSuccess);
  }

  updatePermission(permissionDto: UpdatePermissionCommand, onSuccess?: () => void) {
    this.executeAction(this.permissionAdmin.updatePermission(permissionDto), onSuccess);
  }

  deletePermission(permissionId: number, onSuccess?: () => void) {
    this.executeAction(this.permissionAdmin.deletePermission(permissionId), onSuccess);
  }

  // #endregion

  // #region 2. Role Permissions (صلاحيات الأدوار)

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

  addRolePermission(rolepermission: AddRolePermissionCommand, onSuccess?: () => void) {
    this.executeAction(this.rolePermissionAdmin.addRolePermission(rolepermission), onSuccess);
  }

  deleteRolePermission(rolepermission: DeleteRolePermissionCommand, onSuccess?: () => void) {
    this.executeAction(this.rolePermissionAdmin.removeRolePermission(rolepermission), onSuccess);
  }

  // #endregion

  // #region 3. User Permissions (صلاحيات المستخدمين)

  getPermissionsByUserId(userId: string) {
    this.isLoading.set(true);
    this.userPermissionPublic
      .getPermissionsByUserId(userId)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => this.userPermissions.set(res.data || []),
        error: (err) => this.handleError(err),
      });
  }

  addUserPermission(userPermission: AddUserPermissionCommand, onSuccess?: () => void) {
    this.executeAction(this.userPermissionAdmin.addUserPermission(userPermission), onSuccess);
  }

  deleteUserPermission(userPermission: DeleteUserPermissionCommand, onSuccess?: () => void) {
    this.executeAction(this.userPermissionAdmin.removeUserPermission(userPermission), onSuccess);
  }

  // #endregion

  // --- دوال مساعدة لتقليل تكرار الكود (Helper Methods) ---

  private executeAction(obs$: any, onSuccess?: () => void) {
    this.isLoading.set(true);
    this.error.set(null);
    obs$.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: () => {
        if (onSuccess) onSuccess();
      },
      error: (err: any) => this.handleError(err),
    });
  }

  private handleError(err: any) {
    const errMsg = err?.error?.message || err?.message || 'حدث خطأ غير متوقع';
    this.error.set(errMsg);
  }
}
