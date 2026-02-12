import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Imports
import { Permission } from '../../Services/permission';
import { PrimengadminModule } from '../../../../../shared/Models/primengadmin/primengadmin-module';
import { DirectionService } from '../../../../../core/Services/direction';

@Component({
  selector: 'app-role-permissions',
  standalone: true,
  imports: [PrimengadminModule, RouterLink],
  providers: [ConfirmationService],
  templateUrl: './role-permissions.html',
})
export class RolePermissions implements OnInit {
  public facade = inject(Permission);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  dir = inject(DirectionService);

  // اسم الدور المستهدف
  roleName = signal<string>('');

  // إدارة نافذة إضافة صلاحية جديدة للدور
  displayAddDialog = signal(false);
  selectedPermissionName = signal<string>('');

  ngOnInit() {
    // 1. استخراج اسم الدور من Query Params
    this.route.queryParams.subscribe((params) => {
      const name = params['roleName'];
      if (name) {
        this.roleName.set(name);
        this.loadRolePermissions(name);
      }
    });

    // 2. جلب جميع الصلاحيات المتوفرة في النظام لملء الـ Dropdown
    this.facade.getAllPermissions();
  }

  loadRolePermissions(name: string) {
    // نستخدم اسم الدور لجلب الصلاحيات المرتبطة به
    this.facade.getPermissionsByRoleName(name);
  }

  openAddDialog() {
    this.selectedPermissionName.set('');
    this.displayAddDialog.set(true);
  }

  assignPermissionToRole() {
    const command = {
      roleName: this.roleName(),
      permissionName: this.selectedPermissionName(),
    };

    this.facade.addRolePermission(command, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'تمت الإضافة',
        detail: 'تم ربط الصلاحية بالدور بنجاح',
      });
      this.displayAddDialog.set(false);
      this.loadRolePermissions(this.roleName()); // إعادة تحميل الجدول
    });
  }

  removePermissionFromRole(permissionName: string) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف صلاحية (${permissionName}) من هذا الدور؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const command = {
          roleName: this.roleName(),
          permissionName: permissionName,
        };
        this.facade.deleteRolePermission(command, () => {
          this.messageService.add({
            severity: 'info',
            summary: 'تم الحذف',
            detail: 'تم فك ارتباط الصلاحية بالدور',
          });
          this.loadRolePermissions(this.roleName());
        });
      },
    });
  }
}
