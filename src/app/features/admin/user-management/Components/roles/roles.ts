import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Imports
import { TooltipModule } from 'primeng/tooltip';
import { RoleFacade } from '../../Services/role-facade';
import { PrimengadminModule } from '../../../../../shared/Models/primengadmin/primengadmin-module';
import { DirectionService } from '../../../../../core/Services/direction';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [PrimengadminModule, TooltipModule, RouterModule],
  providers: [ConfirmationService],
  templateUrl: './roles.html',
})
export class Roles implements OnInit {
  public roleFacade = inject(RoleFacade);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  dir = inject(DirectionService);

  // إدارة الـ Dialog
  displayDialog = signal(false);
  isEditMode = signal(false);

  // النموذج
  roleForm = {
    oldName: '', // سنستخدمه في التعديل
    newName: '', // الاسم الجديد
  };

  ngOnInit() {
    this.roleFacade.getAllRoles();
  }

  openAddDialog() {
    this.isEditMode.set(false);
    this.roleForm = { oldName: '', newName: '' };
    this.displayDialog.set(true);
  }

  openEditDialog(role: any) {
    this.isEditMode.set(true);
    this.roleForm = { oldName: role.name, newName: role.name };
    this.displayDialog.set(true);
  }

  saveRole() {
    if (this.isEditMode()) {
      // تحديث الدور
      this.roleFacade.updateRole({
        oldName: this.roleForm.oldName,
        newName: this.roleForm.newName,
      });
      this.messageService.add({
        severity: 'success',
        summary: 'نجاح',
        detail: 'تم تحديث اسم الدور',
      });
    } else {
      // إضافة دور جديد
      this.roleFacade.createRole({ roleName: this.roleForm.newName });
      this.messageService.add({
        severity: 'success',
        summary: 'نجاح',
        detail: 'تم إنشاء الدور بنجاح',
      });
    }
    this.displayDialog.set(false);
  }

  confirmDelete(roleName: string) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من حذف دور (${roleName})؟ سيتم فقدان جميع الصلاحيات المرتبطة به.`,
      header: 'تأكيد الحذف النهائي',
      icon: 'pi pi-trash',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.roleFacade.deleteRole({ name: roleName });
        this.messageService.add({
          severity: 'info',
          summary: 'تم الحذف',
          detail: 'تم حذف الدور من النظام',
        });
      },
    });
  }
}
