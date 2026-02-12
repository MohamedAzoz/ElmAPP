import { Injectable, signal } from '@angular/core';
import {
  AddRoleCommand,
  DeleteRoleCommand,
  RoleAdminClient,
  RoleDto,
  RolePublicClient,
  UpdateRoleCommand,
} from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})

export class RoleFacade {
  // Signals لإدارة حالة الأدوار (Roles State)
  roles = signal<RoleDto[]>([]);
  userRoles = signal<any[]>([]); // لتخزين أدوار مستخدم معين
  isLoading = signal<boolean>(false);
  error = signal<any>(null);

  constructor(
    private rolePublicClient: RolePublicClient,
  ) {}
  // جلب أدوار مستخدم معين (Public Client)
  getUserRoles(userId: string) {
    this.isLoading.set(true);
    this.rolePublicClient.getUserRoles(userId).subscribe({
      next: (res) => {
        this.userRoles.set(res.data || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.error.set(err);
        this.isLoading.set(false);
      },
    });
  }
 
}
