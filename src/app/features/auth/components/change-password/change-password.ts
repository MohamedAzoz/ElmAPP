import { Component, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthFacade } from '../../../../core/Auth/services/auth-facade';
import { MessageService } from 'primeng/api';
import { IdentitySignals } from '../../../../core/Auth/services/identity-signals';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-change-password',
  imports: [ReactiveFormsModule, RouterLink, PasswordModule, ButtonModule, MessageModule],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
})
export class ChangePassword implements OnInit {
  private fb = inject(FormBuilder);
  private messageService = inject(MessageService);
  private identity = inject(IdentitySignals);
  public authFacade = inject(AuthFacade);
  private router = inject(Router);

  changePasswordForm!: FormGroup;

  ngOnInit() {
    this.changePasswordForm = this.fb.group(
      {
        currentPassword: [
          '',
          [Validators.required, Validators.pattern('^[a-zA-Z][a-zA-Z0-9@#$!%*?&]{6,20}$')],
        ],
        newPassword: [
          '',
          [Validators.required, Validators.pattern('^[a-zA-Z][a-zA-Z0-9@#$!%*?&]{6,20}$')],
        ],
        confidentialPassword: ['', [Validators.required]],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  // تحقق من تطابق كلمة المرور الجديدة والتأكيد
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPass = control.get('newPassword');
    const confirmPass = control.get('confidentialPassword');
    return newPass && confirmPass && newPass.value !== confirmPass.value
      ? { passwordMismatch: true }
      : null;
  }

  onSubmit() {
    if (this.changePasswordForm.valid) {
      this.authFacade.changePassword(this.changePasswordForm.value, () => {
        this.messageService.add({
          severity: 'success',
          summary: 'تم التغيير',
          detail: 'تم تغيير كلمة المرور بنجاح، يرجى تسجيل الدخول مجدداً',
        });
        // توجيه المستخدم لتسجيل الدخول بعد التغيير بنجاح
        setTimeout(() => this.router.navigate(['/main/login']), 800);
      });
    } else {
      this.changePasswordForm.markAllAsTouched();
    }
  }
}
