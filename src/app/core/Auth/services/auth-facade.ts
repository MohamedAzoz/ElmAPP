import { inject, Injectable, signal } from '@angular/core';
import {
  AuthClient,
  AuthModelDto,
  ChangePasswordCommand,
  LoginCommand,
  ResultOfAuthModelDto,
} from '../../../core/api/clients';
import { Token } from './token';
import { catchError, Observable, tap } from 'rxjs';
import { PermissionFacade } from './permission-facade';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  // Signals لحفظ حالة البيانات والتحميل والأخطاء
  public userDataStore = signal<AuthModelDto | null>(null);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);

  private permissionFacade = inject(PermissionFacade);
  private authClient = inject(AuthClient);
  private http = inject(HttpClient);

  private tokenService = inject(Token);
  private router = inject(Router);
 

  login(dto: LoginCommand, onSuccess?: () => void) {
    this.isLoading.set(true);
    this.error.set(null);

    this.authClient.login(dto).subscribe({
      next: (res) => {
        const data = res.data!;
        // تخزين التوكنات
        this.tokenService.setTokens({
          access: data.token!,
          expires_on: data.expiresOn!.toString(),
        });
        this.tokenService.setValue('fullName', data.fullName!);
        this.tokenService.setValue('roles', JSON.stringify(data.roles));
        this.tokenService.setValue('userName', data.userName!);
        this.tokenService.setValue('userId', data.userId!);
        this.tokenService.setValue('isAuthenticated', data.isAuthenticated!.toString());
        this.permissionFacade.getPermissionsByUserId(data.userId!);
        // تحديث الـ Signal بالبيانات
        this.userDataStore.set(data);
        this.isLoading.set(false);

        // تنفيذ callback اختياري (مثلاً للتوجيه لصفحة أخرى)
        if (onSuccess) onSuccess();
      },
      error: (err) => {
        this.handleError(err);
      },
    });
  }

  refresh(): Observable<ResultOfAuthModelDto> {
    return this.http
      .post<ResultOfAuthModelDto>(
        `${environment.apiUrl}api/Auth/RefreshToken`,
        {}, // body فاضي لأن الـ Backend مش بياخد parameters
        { withCredentials: true }, // ← مهم جداً عشان الـ Cookie تتبعت
      )
      .pipe(
        tap((res) => {
          const data = res.data;
          if (data) {
            this.tokenService.setTokens({
              access: data.token!,
              expires_on: data.expiresOn!.toString(),
            });
            this.tokenService.setValue('fullName', data.fullName!);
            this.tokenService.setValue('roles', JSON.stringify(data.roles));
            this.tokenService.setValue('userName', data.userName!);
            this.tokenService.setValue('userId', data.userId!);
            this.permissionFacade.getPermissionsByUserId(data.userId!);
            this.userDataStore.set(data); // تحديث الـ Signal
          }
        }),
        catchError((err) => {
          this.logout(); // إذا فشل التحديث نسجل خروج
          throw err;
        }),
      );
  }

  logout() {
    this.authClient.logout().subscribe({
      next: () => {
        this.clearState();
      },
      error: () => {
        this.clearState(); // حتى لو فشل الطلب في السيرفر، نمسح البيانات محلياً
      },
      complete: () => {
        this.router.navigate(['/main/login']);
      },
    });
  }

  changePassword(changePasswordCommand: ChangePasswordCommand, onSuccess?: () => void) {
    this.executeAction(this.authClient.changePassword(changePasswordCommand), onSuccess);
  }

  // دالة مساعدة لتقليل تكرار الكود في العمليات التي لا تحتاج تخزين بيانات كبيرة
  private executeAction(obs$: any, onSuccess?: () => void) {
    this.isLoading.set(true);
    obs$.subscribe({
      next: () => {
        this.isLoading.set(false);
        if (onSuccess) onSuccess();
      },
      error: (err: any) => this.handleError(err),
    });
  }

  private handleError(err: any) {
    this.isLoading.set(false);
    this.error.set(err?.message || 'حدث خطأ ما');
  }

  private clearState() {
    this.tokenService.clear();
    this.userDataStore.set(null);
    this.isLoading.set(false);
  }
}
