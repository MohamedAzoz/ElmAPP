import { inject, Injectable, signal } from '@angular/core';
import {
  AuthClient,
  AuthModelDto,
  ChangePasswordCommand,
  LoginCommand,
  ResultOfAuthModelDto,
} from '../../../core/api/clients';
import { Router } from '@angular/router';
import { LocalStorage } from '../../Services/local-storage';
import { JWT } from '../../Services/jwt';

@Injectable({ providedIn: 'root' })
export class AuthFacade {
  private localStorage = inject(LocalStorage);
  private jwt = inject(JWT);
  public userDataStore = signal<AuthModelDto | null>(null);
  public isLoading = signal<boolean>(false);
  public error = signal<string | null>(null);
  private _loggingOut = false;

  private authClient = inject(AuthClient);
  private router = inject(Router);

  constructor() {
    const token = this.localStorage.get('access_token');
    const fullName = this.localStorage.get('fullName');
    if (token) {
      this.userDataStore.set({
        token,
        fullName,
        isAuthenticated: true,
      });
    }
  }

  login(dto: LoginCommand, onSuccess?: () => void) {
    this.isLoading.set(true);
    this.error.set(null);
    this.authClient.login(dto).subscribe({
      next: (res) => {
        const data = res.data!;
        if (data) {
          // 💡 التعديل هنا: تحويل البيانات إلى String قبل حفظها
          this.localStorage.set('fullName', data.fullName!);
          this.localStorage.set('access_token', data.token!);
          
          try {
            const decoded = this.jwt.decodeToken(data.token!);
            if (decoded) {
              if (decoded.role) {
                this.localStorage.set('role', decoded.role);
              }
              if (decoded.sub) {
                this.localStorage.set('userId', decoded.sub);
              }
              if (decoded.exp) {
                const expDate = new Date(decoded.exp * 1000).toISOString();
                this.localStorage.set('expires_on', expDate);
              }
            }
          } catch (e) {
            console.error('Error decoding token:', e);
          }
          
          this.userDataStore.set(data);
        }
        this.router.navigate(['/main/home']);
        if (onSuccess) onSuccess();
      },
      error: (err: ResultOfAuthModelDto) => {
        this.handleError(err);
      },
    });
  }

  logout() {
    this.authClient.logout().subscribe({
      next: () => {
        this.clearState();
        this.router.navigate(['/main/login']);
      },
      error: (err) => {
        console.error('Logout failed:', err);
        this.clearState();
        this.router.navigate(['/main/login']);
      },
    });
  }

  forceLogout() {
    if (this._loggingOut) return;
    this._loggingOut = true;
    this.clearState();
    this.router.navigate(['/main/login']).then(() => {
      this._loggingOut = false;
    });
  }

  changePassword(changePasswordCommand: ChangePasswordCommand, onSuccess?: () => void) {
    this.executeAction(this.authClient.changePassword(changePasswordCommand), onSuccess);
  }

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

  private handleError(err: ResultOfAuthModelDto) {
    this.isLoading.set(false);
    console.log(err);
    this.error.set(err?.errors?.at(0)?.errorMessage || 'حدث خطأ ما');
  }


  clearState() {
    this.localStorage.remove('fullName');
    this.localStorage.remove('role');
    this.localStorage.remove('userId');
    this.localStorage.remove('expires_on');
    this.localStorage.remove('access_token');
    this.userDataStore.set(null);
    this.isLoading.set(false);
  }
}
