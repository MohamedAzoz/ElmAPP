import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthFacade } from '../../../../core/Auth/services/auth-facade';
// PrimeNG Imports
import { MessageService } from 'primeng/api';
import { GlobalService } from '../../../../core/Services/global-service';
import { PrimengModule } from '../../../../shared/Models/primeng/primeng-module';
import { DirectionService } from '../../../../core/Services/direction';

@Component({
  selector: 'app-log-in',
  imports: [ReactiveFormsModule, PrimengModule],
  templateUrl: './log-in.html',
  styleUrl: './log-in.scss',
})
export class LogIn implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private globalService = inject(GlobalService);
  public authFacade = inject(AuthFacade);
  dir = inject(DirectionService);

  loginForm!: FormGroup;

  ngOnInit() {
    this.globalService.setTitle('تسجيل الدخول');
    this.loginForm = this.fb.group({
      userName: ['', [Validators.required, Validators.minLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
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
