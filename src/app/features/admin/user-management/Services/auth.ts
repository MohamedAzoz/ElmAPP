import { inject, Injectable, signal } from '@angular/core';
import {
  RegisterDoctorCommand,
  DeleteCommand,
  AuthAdminClient,
  DoctorDto,
  LeaderDto,
  RegisterLeaderCommand,
} from '../../../../core/api/clients';
import { finalize } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private authAdmin = inject(AuthAdminClient);

  // Signals للحالة
  public doctors = signal<DoctorDto[]>([]);
  public totalCount = signal<number>(0);
  public leaders = signal<LeaderDto[]>([]);
  public totalCountLeader = signal<number>(0);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  // جلب الأطباء بتحديث الـ Signal
  getAllDoctor(pageSize: number = 10, pageNumber: number = 1) {
    this.isLoading.set(true);
    this.authAdmin
      .getAllDoctor(pageSize, pageNumber)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.doctors.set(res.data || []);
          this.totalCount.set(res['totalCount'] || res.data?.length || 0);
        },
        error: (err) => this.error.set(err?.message || 'خطأ في جلب البيانات'),
      });
  }

  getAllLeader(pageSize: number = 10,pageNumber: number = 1 ) {
    this.isLoading.set(true);
    this.authAdmin
      .getAllLeader(pageSize, pageNumber)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.leaders.set(res.data || []);
          this.totalCountLeader.set(res['totalCountLeader'] || res.data?.length || 0);
        },
        error: (err) => this.error.set(err?.message || 'خطأ في جلب البيانات'),
      });
  }

  registerDoctor(dto: RegisterDoctorCommand, onSuccess?: () => void) {
    this.executeAction(this.authAdmin.registerDoctor(dto), onSuccess);
  }

  registerLeader(dto: RegisterLeaderCommand, onSuccess?: () => void) {
    this.executeAction(this.authAdmin.registerLeader(dto), onSuccess);
  }

  deleteUser(userId: string, onSuccess?: () => void) {
    const dto: DeleteCommand = { userId: userId };
    this.executeAction(this.authAdmin.delete(dto), onSuccess);
  }

  activeUser(userId: string, onSuccess?: () => void) {
    this.executeAction(this.authAdmin.activateUser(userId), onSuccess);
  }

  deActiveUser(userId: string, onSuccess?: () => void) {
    this.executeAction(this.authAdmin.deactivateUser(userId), onSuccess);
  }

  private executeAction(obs$: any, onSuccess?: () => void) {
    this.isLoading.set(true);
    obs$.pipe(finalize(() => this.isLoading.set(false))).subscribe({
      next: () => {
        if (onSuccess) onSuccess();
      },
      error: (err: any) => this.error.set(err?.message || 'حدث خطأ ما'),
    });
  }
}
