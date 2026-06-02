import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../../core/Auth/services/auth-facade';
// PrimeNG Imports
import { MessageService } from 'primeng/api';
import { LockUi } from '../../../../shared/Components/lock-ui/lock-ui';
import { RateLimitService } from '../../../../core/Services/rate-limit-service';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';

@Component({
  selector: 'app-log-in',
  imports: [
    ReactiveFormsModule,
    LockUi,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
  ],
  templateUrl: './log-in.html',
  styleUrl: './log-in.css',
})
export class LogIn implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(MessageService);
  public rateLimitService = inject(RateLimitService);
  public authFacade = inject(AuthFacade);
  // dir = inject(DirectionService);

  loginForm!: FormGroup;

  ngOnInit() {
    this.authFacade.clearState();

    this.loginForm = this.fb.group({
      userName: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z][a-zA-Z0-9@#$!%*?&]{6,25}$')],
      ],
      // password mach Mz@200445 ar any password the same rules
      password: [
        '',
        [Validators.required, Validators.pattern('^[a-zA-Z][a-zA-Z0-9@#$!%*?&]{6,20}$')],
      ],
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.authFacade.login(this.loginForm.value, () => {
        this.messageService.add({
          severity: 'success',
          summary: 'تم الدخول بنجاح',
          detail: `أهلاً بك ${this.authFacade.userDataStore()?.fullName}`,
        });
        setTimeout(() => this.router.navigate(['/main/home']), 700);
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }
}
