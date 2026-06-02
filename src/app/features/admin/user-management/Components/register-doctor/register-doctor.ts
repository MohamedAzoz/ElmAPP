import { Component, effect, inject, signal } from '@angular/core';
import { Auth } from '../../Services/auth'; // تأكد من المسار
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Imports
import { TooltipModule } from 'primeng/tooltip';
import { RouterLink } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { TableModule } from 'primeng/table';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { TagModule } from 'primeng/tag';

@Component({
  selector: 'app-register-doctor',
  imports: [
    TooltipModule,
    RouterLink,
    ButtonModule,
    DialogModule,
    TableModule,
    ConfirmDialogModule,
    InputTextModule,
    PasswordModule,
    FormsModule,
    CommonModule,
    TagModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './register-doctor.html',
  styleUrl: './register-doctor.css',
})
export class RegisterDoctor {
  public auth = inject(Auth);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  displayDialog = signal(false);
  first = signal(1);
  rows = signal(10);
  // نموذج إضافة دكتور جديد
  doctorForm = {
    userName: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    title: '',
  };

  constructor() {
    effect(() => {
      this.auth.getAllDoctor(this.rows(), this.first());
    });
  }

  loadDoctors(event: any) {
    const pageNumber = event.first / event.rows + 1;
    const pageSize = event.rows;

    this.auth.getAllDoctor(pageSize, pageNumber);
  }

  openAddDialog() {
    this.doctorForm = { userName: '', password: '', confirmPassword: '', fullName: '', title: '' };
    this.displayDialog.set(true);
  }

  saveDoctor() {
    this.auth.registerDoctor(this.doctorForm, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'تم الحفظ',
        detail: 'تم تسجيل الدكتور بنجاح',
      });
      this.displayDialog.set(false);
      this.auth.getAllDoctor(this.rows(), this.first());
    });
  }

  toggleStatus(user: any) {
    const action = user.isActived ? 'إلغاء تفعيل' : 'تفعيل';
    this.confirmationService.confirm({
      message: `هل أنت متأكد من ${action} الحساب لـ ${user.fullName}؟`,
      accept: () => {
        if (user.isActived) {
          this.auth.deActiveUser(user.userId, () => this.onActionSuccess('تم إلغاء التفعيل'));
        } else {
          this.auth.activeUser(user.userId, () => this.onActionSuccess('تم التفعيل بنجاح'));
        }
      },
    });
  }

  deleteDoctor(userId: string) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذا الدكتور نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      header: 'تحذير حذف',
      icon: 'pi pi-trash',
      acceptLabel: 'حذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.auth.deleteUser(userId, () => this.onActionSuccess('تم حذف الدكتور بنجاح'));
      },
    });
  }

  private onActionSuccess(msg: string) {
    this.messageService.add({ severity: 'info', summary: 'نجاح', detail: msg });
    this.auth.getAllDoctor(this.rows(), this.first());
  }
}
