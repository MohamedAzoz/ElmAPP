import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MessageService } from 'primeng/api';
// PrimeNG Modules
import { RatingModule } from 'primeng/rating';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { CardModule } from 'primeng/card';
import { FileFacade } from '../Services/file-facade';
import { TextareaModule } from 'primeng/textarea';
import { IdentitySignals } from '../../../core/Auth/services/identity-signals';

@Component({
  selector: 'app-rate-file',
  imports: [
    ReactiveFormsModule,
    RatingModule,
    TextareaModule,
    ButtonModule,
    ToastModule,
    CardModule,
  ],
  templateUrl: './rate-file.html',
  styleUrl: './rate-file.scss',
})
export class RateFile implements OnInit {
  private fb = inject(FormBuilder);
  public route = inject(ActivatedRoute);
  public router = inject(Router);
  private fileFacade = inject(FileFacade);
  private identity = inject(IdentitySignals);
  private messageService = inject(MessageService);

  rateForm!: FormGroup;
  isSubmitting = false;

  ngOnInit() {
    const fileId = Number(this.route.snapshot.paramMap.get('fileId'));
    const doctorId = this.identity.userId;

    this.rateForm = this.fb.group({
      fileId: [fileId, Validators.required],
      userId: [doctorId, Validators.required],
      rating: [null, [Validators.required, Validators.min(1)]],
      comment: [''],
    });
    console.log(this.rateForm.value);
    
  }

  submitRating() {
    if (this.rateForm.invalid) return;

    this.isSubmitting = true;
    this.fileFacade.rateFile(this.rateForm.value).subscribe({
      next: (res: any) => {
        if (res.isSuccess) {
          this.messageService.add({
            severity: 'success',
            summary: 'تم التقييم',
            detail: 'تم حفظ تقييمك بنجاح',
          });
          setTimeout(() => this.router.navigate(['../../'], { relativeTo: this.route }), 1000);
        }
        this.isSubmitting = false;
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'فشل في حفظ التقييم، حاول مرة أخرى',
        });
        this.isSubmitting = false;
      },
    });
  }
}
