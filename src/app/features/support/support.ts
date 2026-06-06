import { Component, inject, signal, computed } from '@angular/core';
import {
  ReactiveFormsModule,
  FormBuilder,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupportFacade } from './support-facade';

// ─── Custom Validators ────────────────────────────────────────────────────────

/** RFC 5322-inspired email regex – stricter than the built-in one */
function strictEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const pattern =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return pattern.test(control.value) ? null : { invalidEmail: true };
}

/** Block disposable / temporary email domains */
function disposableEmailValidator(control: AbstractControl): ValidationErrors | null {
  if (!control.value) return null;
  const disposable = [
    'mailinator.com',
    'tempmail.com',
    'guerrillamail.com',
    'throwam.com',
    'yopmail.com',
    'sharklasers.com',
    'trashmail.com',
    'dispostable.com',
    '10minutemail.com',
  ];
  const domain = control.value.split('@')[1]?.toLowerCase();
  return domain && disposable.includes(domain) ? { disposableEmail: true } : null;
}

// ─── Component ────────────────────────────────────────────────────────────────

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support {
  private fb = inject(FormBuilder);
  private facade = inject(SupportFacade);

  // ── State ──────────────────────────────────────────────────────────────────
  submitState = signal<SubmitState>('idle');
  serverMessage = signal<string | null>(null);
  previewUrls = signal<string[]>([]);

  isLoading = computed(() => this.submitState() === 'loading');
  isSuccess = computed(() => this.submitState() === 'success');
  isError = computed(() => this.submitState() === 'error');

  // ── Form ───────────────────────────────────────────────────────────────────
  form = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
    email: ['', [Validators.required, strictEmailValidator, disposableEmailValidator]],
    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
  });

  // ── Helpers ────────────────────────────────────────────────────────────────
  get name() {
    return this.form.controls.name;
  }
  get email() {
    return this.form.controls.email;
  }
  get message() {
    return this.form.controls.message;
  }

  messageLength = computed(() => this.form.controls.message.value?.length ?? 0);

  getError(control: AbstractControl): string | null {
    if (control.pristine || control.valid) return null;
    const e = control.errors!;
    if (e['required']) return 'هذا الحقل مطلوب';
    if (e['minlength']) return `الحد الأدنى ${e['minlength'].requiredLength} أحرف`;
    if (e['maxlength']) return `الحد الأقصى ${e['maxlength'].requiredLength} حرف`;
    if (e['invalidEmail']) return 'صيغة البريد الإلكتروني غير صحيحة';
    if (e['disposableEmail']) return 'يُرجى استخدام بريد إلكتروني دائم';
    return 'قيمة غير صالحة';
  }

  // ── Image upload ───────────────────────────────────────────────────────────
  // Keep actual File objects for sending + base64 strings only for preview
  imageFiles: File[] = []; // ← sent to API as real Blob/File
  readonly MAX_IMAGES = 5;
  readonly MAX_MB = 2;

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const slots = this.MAX_IMAGES - this.imageFiles.length;
    const allowed = files.slice(0, slots);

    allowed.forEach((file) => {
      if (file.size > this.MAX_MB * 1024 * 1024) return;

      // Store the original File for uploading
      this.imageFiles.push(file);

      // Generate a preview URL (only for display — never sent to API)
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        this.previewUrls.update((arr) => [...arr, dataUrl]);
      };
      reader.readAsDataURL(file);
    });

    input.value = '';
  }

  removeImage(index: number): void {
    this.imageFiles.splice(index, 1);
    this.previewUrls.update((arr) => arr.filter((_, i) => i !== index));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitState.set('loading');
    this.serverMessage.set(null);

    const { name, email, message } = this.form.value;
    this.facade.submitError(name ?? '', email ?? '', message ?? '', this.imageFiles).subscribe({
      next: (res) => {
        const isFailure = res?.isSuccess === false;

        if (!isFailure) {
          this.submitState.set('success');
          this.serverMessage.set(
            res?.message ??
              res?.errors?.[0]?.errorMessage ??
              'تم إرسال رسالتك بنجاح! سيتواصل معك فريق الدعم قريباً.',
          );
          this.form.reset();
          this.imageFiles = [];
          this.previewUrls.set([]);
        } else {
          this.submitState.set('error');
          this.serverMessage.set(
            res?.errors?.[0]?.errorMessage ?? res?.message ?? 'حدث خطأ. يُرجى المحاولة مرة أخرى.',
          );
        }
      },
      error: () => {
        this.submitState.set('error');
        this.serverMessage.set('تعذّر الاتصال بالخادم. تحقق من اتصالك وحاول مجدداً.');
      },
    });
  }

  resetForm(): void {
    this.submitState.set('idle');
    this.serverMessage.set(null);
    this.form.reset();
    this.imageFiles = [];
    this.previewUrls.set([]);
  }
}
