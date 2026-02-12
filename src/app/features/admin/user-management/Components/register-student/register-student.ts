import { Component, effect, inject, signal } from '@angular/core';
// تأكد من المسار الصحيح
import { MessageService, ConfirmationService } from 'primeng/api';

// PrimeNG Imports
import { TooltipModule } from 'primeng/tooltip';
import { Auth } from '../../Services/auth';
import { PrimengadminModule } from '../../../../../shared/Models/primengadmin/primengadmin-module';
import { DirectionService } from '../../../../../core/Services/direction';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RegisterLeaderCommand } from '../../../../../core/api/clients';
import { YearFacade } from '../../../management/Year/Services/year-facade';
import { DepartmentFacade } from '../../../management/Department/Services/department-facade';
import { CollegeFacade } from '../../../management/Colleges/Services/college-facade';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-student',
  imports: [TooltipModule, PrimengadminModule, RouterLink],
  providers: [ConfirmationService],
  templateUrl: './register-student.html',
  styleUrl: './register-student.scss',
})
export class RegisterStudent {
  public authService = inject(Auth);
  private messageService = inject(MessageService);
  private confirmationService = inject(ConfirmationService);
  collegeService = inject(CollegeFacade);
  yearService = inject(YearFacade);
  departmentService = inject(DepartmentFacade);
  dir = inject(DirectionService);
  displayDialog = signal(false);

  registerLeaderForm = {
    userName: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    yearId: 0,
    departmentId: 0,
  };

  // إعدادات الصفوف الافتراضية
  rows = signal(5);
  first = signal(1);
  constructor() {
    effect(() => {
      this.authService.getAllLeader(this.rows(), this.first());
    });
  }

  // دالة جلب البيانات المرتبطة بالـ Lazy Loading في الجدول
  loadLeaders(event: any) {
    const pageNumber = event.first / event.rows + 1;
    const pageSize = event.rows;

    this.authService.getAllLeader(pageSize, pageNumber);
  }

  toggleLeaderStatus(leader: any) {
    const actionLabel = leader.isActived ? 'إلغاء تفعيل' : 'تفعيل';

    this.confirmationService.confirm({
      message: `هل أنت متأكد من ${actionLabel} حساب القائد: ${leader.fullName}؟`,
      header: 'تأكيد تغيير الحالة',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (leader.isActived) {
          this.authService.deActiveUser(leader.userId, () =>
            this.onSuccess('تم إلغاء تفعيل الحساب'),
          );
        } else {
          this.authService.activeUser(leader.userId, () => this.onSuccess('تم تفعيل الحساب بنجاح'));
        }
      },
    });
  }

  deleteLeader(userId: string) {
    this.confirmationService.confirm({
      message: 'هل أنت متأكد من حذف هذا القائد نهائياً؟ لا يمكن التراجع عن هذا الإجراء.',
      header: 'تحذير حذف',
      icon: 'pi pi-trash',
      acceptLabel: 'حذف',
      rejectLabel: 'إلغاء',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.authService.deleteUser(userId, () => this.onSuccess('تم حذف القائد بنجاح'));
      },
    });
  }

  private onSuccess(detail: string) {
    this.messageService.add({ severity: 'success', summary: 'نجاح', detail });
    // إعادة تحميل الصفحة الحالية بعد العملية
    this.authService.getAllLeader(this.rows(), this.first());
  }

  openAddLeader() {
    this.registerLeaderForm = {
      userName: '',
      password: '',
      fullName: '',
      yearId: 0,
      departmentId: 0,
      confirmPassword: '',
    };
    this.displayDialog.set(true);
    // effect(() => {
    if (this.collegeService.universityId) {
      this.yearService.getAllYears(this.collegeService.universityId);
      this.departmentService.getDepartmentsByCollege(this.collegeService.universityId);
    }
    // });
  }

  saveLeader() {
    this.authService.registerLeader(this.registerLeaderForm, () => {
      this.messageService.add({
        severity: 'success',
        summary: 'تم الحفظ',
        detail: 'تم تسجيل الدكتور بنجاح',
      });
      this.displayDialog.set(false);
      this.authService.getAllLeader(this.rows(), this.first());
    });
  }
}
