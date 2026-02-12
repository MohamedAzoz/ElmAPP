import { Injectable, signal } from '@angular/core';
import {
  AddRoleCommand,
  DeleteRoleCommand,
  RoleAdminClient,
  RoleDto,
  UpdateRoleCommand,
} from '../../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class RoleFacade {
  // Signals لإدارة حالة الأدوار (Roles State)
  roles = signal<RoleDto[]>([]);
  isLoading = signal<boolean>(false);
  error = signal<any>(null);

  constructor(private roleAdminClient: RoleAdminClient) {}

  // جلب جميع الأدوار
  getAllRoles() {
    this.isLoading.set(true);
    this.error.set(null);

    this.roleAdminClient.getAllRoles().subscribe({
      next: (res) => {
        this.roles.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.isLoading.set(false);
      },
    });
  }

  // إنشاء دور جديد
  createRole(addRole: AddRoleCommand) {
    this.isLoading.set(true);
    this.roleAdminClient.createRole(addRole).subscribe({
      next: () => {
        // بعد النجاح، نقوم بتحديث القائمة تلقائياً
        this.getAllRoles();
      },
      error: (err) => {
        this.error.set(err);
        this.isLoading.set(false);
      },
    });
  }

  // حذف دور
  deleteRole(deleteRole: DeleteRoleCommand) {
    this.isLoading.set(true);
    this.roleAdminClient.deleteRole(deleteRole).subscribe({
      next: () => {
        // تحديث القائمة بعد الحذف
        this.getAllRoles();
      },
      error: (err) => {
        this.error.set(err);
        this.isLoading.set(false);
      },
    });
  }

  // تحديث دور
  updateRole(updateRole: UpdateRoleCommand) {
    this.isLoading.set(true);
    this.roleAdminClient.updateRole(updateRole).subscribe({
      next: () => {
        // تحديث القائمة بعد التعديل
        this.getAllRoles();
      },
      error: (err) => {
        this.error.set(err);
        this.isLoading.set(false);
      },
    });
  }
}
