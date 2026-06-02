import { Injectable, signal } from '@angular/core';
import { RoleAdminClient, RoleDto   } from '../../../../core/api/clients';

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
}
