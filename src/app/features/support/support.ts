import { Component, inject, signal, computed, OnInit, NgZone } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { SupportFacade } from './support-facade';
import { environment } from '../../../environments/environment.development';

declare var google: any;

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

@Component({
  selector: 'app-support',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './support.html',
  styleUrl: './support.css',
})
export class Support implements OnInit {
  private fb = inject(FormBuilder);
  private facade = inject(SupportFacade);
  private ngZone = inject(NgZone);

  // ── State ──────────────────────────────────────────────────────────────────
  submitState = signal<SubmitState>('idle');
  serverMessage = signal<string | null>(null);
  previewUrls = signal<string[]>([]);
  verifiedEmail = signal<string | null>(null);
  verifiedName = signal<string | null>(null);
  verifiedAvatar = signal<string | null>(null);
  googleScriptReady = signal(false); // ✅ تتبع حالة الـ script

  isLoading = computed(() => this.submitState() === 'loading');
  isSuccess = computed(() => this.submitState() === 'success');
  isError = computed(() => this.submitState() === 'error');
  isGoogleVerified = computed(() => !!this.verifiedEmail());

  // ── Form ───────────────────────────────────────────────────────────────────
  form = this.fb.group({
    name: [{ value: '', disabled: true }, [Validators.required, Validators.minLength(2)]],
    email: [{ value: '', disabled: true }, [Validators.required]],
    message: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(2000)]],
  });

  // ── Lifecycle ──────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.loadGoogleScript();
  }

  // ✅ تحميل الـ Script ديناميكياً بدل الاعتماد على أنه موجود
  private loadGoogleScript(): void {
    // لو الـ script موجودة بالفعل
    if (typeof google !== 'undefined' && google?.accounts?.id) {
      this.googleScriptReady.set(true);
      this.initGoogleSignIn();
      return;
    }

    // لو مش موجودة، نضيفها ديناميكياً
    const existing = document.getElementById('google-gsi-script');
    if (existing) {
      // الـ script موجودة بس لسه بتتحمل
      existing.addEventListener('load', () => {
        this.ngZone.run(() => {
          this.googleScriptReady.set(true);
          this.initGoogleSignIn();
        });
      });
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-gsi-script';
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      this.ngZone.run(() => {
        this.googleScriptReady.set(true);
        this.initGoogleSignIn();
      });
    };
    script.onerror = () => {
      this.ngZone.run(() => {
        console.error('فشل تحميل Google Sign-In script');
      });
    };
    document.head.appendChild(script);
  }

  private initGoogleSignIn(): void {
    try {
      google.accounts.id.initialize({
        client_id: environment.googleDrive.clientId,
        callback: (response: any) => this.handleCredentialResponse(response),
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      // ✅ انتظار الـ DOM يكون جاهز
      setTimeout(() => this.renderGoogleButton(), 100);
    } catch (e) {
      console.error('Google Sign-In init error:', e);
    }
  }

  private renderGoogleButton(): void {
    const btn = document.getElementById('googleSignInBtn');
    if (!btn) {
      // لو الـ DOM مش جاهز لسه، حاول تاني
      setTimeout(() => this.renderGoogleButton(), 200);
      return;
    }

    if (typeof google === 'undefined' || !google?.accounts?.id) return;

    btn.innerHTML = '';
    google.accounts.id.renderButton(btn, {
      theme: 'outline',
      size: 'auto',
      text: 'signin_with',
      shape: 'pill',
      locale: 'ar',
    });
  }

  private handleCredentialResponse(response: any): void {
    try {
      const base64Url = response.credential.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64).split('').map(c =>
          '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
        ).join('')
      );
      const payload = JSON.parse(jsonPayload);

      this.ngZone.run(() => {
        this.verifiedEmail.set(payload.email);
        this.verifiedName.set(payload.name);
        this.verifiedAvatar.set(payload.picture ?? null);
        this.submitState.set('idle'); // ✅ تصفير الـ error state بعد login
        this.serverMessage.set(null);
        this.form.patchValue({
          email: payload.email,
          name: payload.name,
        });
      });
    } catch {
      this.ngZone.run(() => {
        this.submitState.set('error');
        this.serverMessage.set('فشل التحقق من حساب جوجل، حاول مرة أخرى.');
      });
    }
  }

  signOut(): void {
    if (typeof google !== 'undefined') {
      google.accounts.id.disableAutoSelect();
    }
    this.verifiedEmail.set(null);
    this.verifiedName.set(null);
    this.verifiedAvatar.set(null);
    this.submitState.set('idle'); // ✅ مسح أي error قديم
    this.serverMessage.set(null);
    this.form.patchValue({ email: '', name: '' });
    setTimeout(() => this.renderGoogleButton(), 100);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────
  get name() { return this.form.controls.name; }
  get email() { return this.form.controls.email; }
  get message() { return this.form.controls.message; }

  messageLength = computed(() => this.form.controls.message.value?.length ?? 0);

  getError(control: AbstractControl): string | null {
    if (control.pristine || control.valid) return null;
    const e = control.errors!;
    if (e['required'])   return 'هذا الحقل مطلوب';
    if (e['minlength'])  return `الحد الأدنى ${e['minlength'].requiredLength} أحرف`;
    if (e['maxlength'])  return `الحد الأقصى ${e['maxlength'].requiredLength} حرف`;
    return 'قيمة غير صالحة';
  }

  // ── Image upload ───────────────────────────────────────────────────────────
  imageFiles: File[] = [];
  readonly MAX_IMAGES = 5;
  readonly MAX_MB = 2;

  onFilesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    const slots = this.MAX_IMAGES - this.imageFiles.length;
    files.slice(0, slots).forEach(file => {
      if (file.size > this.MAX_MB * 1024 * 1024) return;
      this.imageFiles.push(file);
      const reader = new FileReader();
      reader.onload = e => this.previewUrls.update(arr => [...arr, e.target?.result as string]);
      reader.readAsDataURL(file);
    });
    input.value = '';
  }

  removeImage(index: number): void {
    this.imageFiles.splice(index, 1);
    this.previewUrls.update(arr => arr.filter((_, i) => i !== index));
  }

  // ── Submit ─────────────────────────────────────────────────────────────────
  onSubmit(): void {
    // ✅ مسح أي error قديم قبل التحقق
    this.serverMessage.set(null);

    if (!this.isGoogleVerified()) {
      this.submitState.set('error');
      this.serverMessage.set('يرجى تسجيل الدخول بحساب Google أولاً للتحقق من هويتك.');
      return;
    }

    if (this.form.invalid || this.isLoading()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitState.set('loading');

    const { name, email, message } = this.form.getRawValue();

    this.facade.submitError(name ?? '', email ?? '', message ?? '', this.imageFiles).subscribe({
      next: res => {
        if (res?.isSuccess === false) {
          this.submitState.set('error');
          this.serverMessage.set(res?.errors?.[0]?.errorMessage ?? res?.message ?? 'حدث خطأ.');
        } else {
          this.submitState.set('success');
          this.serverMessage.set(res?.message ?? 'تم إرسال رسالتك بنجاح!');
          this.resetForm();
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
    this.signOut();
  }
}