import { Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { Permission } from '../../Services/permission';
import { PrimengadminModule } from '../../../../../shared/Models/primengadmin/primengadmin-module';
import { DirectionService } from '../../../../../core/Services/direction';

@Component({
  selector: 'app-user-permissions',
  imports: [PrimengadminModule],
  providers: [ConfirmationService],
  templateUrl: './user-permissions.html',
  styleUrl: './user-permissions.scss',
})
export class UserPermissions implements OnInit {
  public facade = inject(Permission);
  private route = inject(ActivatedRoute);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  dir = inject(DirectionService);

  // بيانات المستخدم القادمة من الرابط
  userId = signal<string>('');
  userName = signal<string>('');

  // إدارة نافذة الإضافة
  displayAddDialog = signal(false);
  selectedPermissionName = signal<string>('');

  ngOnInit() {
    // 1. جلب البيانات من الـ Query Params
    this.route.queryParams.subscribe((params) => {
      this.userId.set(params['userId']);
      this.userName.set(params['userName']);

      if (this.userId()) {
        this.facade.getPermissionsByUserId(this.userId());
      }
    });

    // 2. جلب كل الصلاحيات المتاحة في النظام لاستخدامها في الـ Dropdown عند الإضافة
    this.facade.getAllPermissions();
  }

  openAddDialog() {
    this.selectedPermissionName.set('');
    this.displayAddDialog.set(true);
  }

  assignPermission() {
    const command = {
      userName: this.userName(),
      permissionName: this.selectedPermissionName(),
    };

    this.facade.addUserPermission(command, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'نجاح',
        detail: 'تم إضافة الصلاحية للمستخدم',
      });
      this.displayAddDialog.set(false);
      this.facade.getPermissionsByUserId(this.userId()); // تحديث الجدول
    });
  }

  removePermission(permissionName: string) {
    this.confirmationService.confirm({
      message: `هل أنت متأكد من سحب صلاحية (${permissionName}) من المستخدم؟`,
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، احذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        const command = {
          userName: this.userName(),
          permissionName: permissionName,
        };
        this.facade.deleteUserPermission(command, () => {
          this.messageService.add({
            severity: 'info',
            summary: 'تم الحذف',
            detail: 'تم سحب الصلاحية بنجاح',
          });
          this.facade.getPermissionsByUserId(this.userId()); // تحديث الجدول
        });
      },
    });
  }
}
