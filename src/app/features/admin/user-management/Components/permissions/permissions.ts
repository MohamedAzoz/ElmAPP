import { Component, OnInit, effect, inject, signal } from '@angular/core';
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG
import { TooltipModule } from 'primeng/tooltip';
import { Permission } from '../../Services/permission';
import { PrimengadminModule } from '../../../../../shared/Models/primengadmin/primengadmin-module';
import { DirectionService } from '../../../../../core/Services/direction';

@Component({
  selector: 'app-permission-management',
  imports: [PrimengadminModule, TooltipModule],
  providers: [MessageService, ConfirmationService],
  templateUrl: './permissions.html',
  styleUrl: './permissions.scss',
})
export class Permissions implements OnInit {
  public facade = inject(Permission);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);

  dir = inject(DirectionService);
  // التحكم في الـ Dialog
  displayDialog = signal(false);
  isEditMode = signal(false);

  // النموذج (Form Model)
  permissionForm = {
    id: 0,
    name: '',
  };

  ngOnInit() {
    this.facade.getAllPermissions();
  }

  openAddDialog() {
    this.isEditMode.set(false);
    this.permissionForm = { id: 0, name: '' };
    this.displayDialog.set(true);
  }

  openEditDialog(permission: any) {
    this.isEditMode.set(true);
    this.permissionForm = { ...permission };
    this.displayDialog.set(true);
  }

  savePermission() {
    if (this.isEditMode()) {
      this.facade.updatePermission(this.permissionForm, () =>
        this.onActionSuccess('تم التعديل بنجاح'),
      );
    } else {
      this.facade.addPermission({ name: this.permissionForm.name }, () =>
        this.onActionSuccess('تمت الإضافة بنجاح'),
      );
    }
  }

  deletePermission(id: number) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذه الصلاحية؟ قد يؤثر ذلك على المستخدمين المرتبطين بها.',
      header: 'تأكيد الحذف',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        this.facade.deletePermission(id, () => this.onActionSuccess('تم الحذف بنجاح'));
      },
    });
  }

  private onActionSuccess(msg: string) {
    this.messageService.add({ severity: 'success', summary: 'نجاح', detail: msg });
    this.displayDialog.set(false);
    this.facade.getAllPermissions(); // تحديث القائمة
  }
}
