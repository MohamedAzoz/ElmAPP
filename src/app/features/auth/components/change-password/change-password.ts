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
import { GlobalService } from '../../../../core/Services/global-service';
import { PrimengModule } from '../../../../shared/Models/primeng/primeng-module';
import { DirectionService } from '../../../../core/Services/direction';
import { IdentitySignals } from '../../../../core/Auth/services/identity-signals'; // لجلب الـ userId

@Component({
  selector: 'app-change-password',
  imports: [PrimengModule, ReactiveFormsModule, RouterLink],
  templateUrl: './change-password.html',
  styleUrl: './change-password.scss',
})
export class ChangePassword implements OnInit {
  private fb = inject(FormBuilder);
  // private router = inject(Router);
  private messageService = inject(MessageService);
  private globalService = inject(GlobalService);
  private identity = inject(IdentitySignals);
  public authFacade = inject(AuthFacade);
  // public dir = inject(DirectionService);
  private router = inject(Router);

  changePasswordForm!: FormGroup;

  ngOnInit() {
    this.globalService.setTitle('تغيير كلمة المرور');

    this.changePasswordForm = this.fb.group(
      {
        userId: [this.identity.userId || '', [Validators.required]],
        currentPassword: ['', [Validators.required]],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
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
