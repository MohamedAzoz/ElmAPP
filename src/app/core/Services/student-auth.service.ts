import {
  inject,
  Injectable,
  signal,
  DestroyRef,
  runInInjectionContext,
  Injector,
} from '@angular/core';
import {
  Auth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User,
} from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { firstValueFrom, catchError, of } from 'rxjs';

export interface StudentProfile {
  college: number;
  academicYear: number;
  department: number;
  isConfigured: boolean;
}

@Injectable({ providedIn: 'root' })
export class StudentAuthService {
  private readonly auth       = inject(Auth);
  private readonly firestore  = inject(Firestore);
  private readonly router      = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector   = inject(Injector);
  private readonly db         = inject(CatbeeIndexedDBService);

  readonly currentUser    = signal<User | null>(null);
  readonly studentProfile = signal<StudentProfile | null>(null);
  readonly loginError     = signal<string | null>(null);
  readonly isLoading      = signal<boolean>(false);

  constructor() {
    this.initAuth();
  }

  // ── Init ───────────────────────────────────────────────────────────

  private initAuth(): void {
    runInInjectionContext(this.injector, () => {
      // طالما نستخدم Popup، لا داعي لانتظار getRedirectResult هنا، مما يسرع تشغيل التطبيق.

      // Auth State Listener مراقب حالة المستخدم
      const unsubscribe = onAuthStateChanged(this.auth, (firebaseUser) => {
        this.currentUser.set(firebaseUser);

        if (firebaseUser) {
          void this.fetchProfileFromFirestore(firebaseUser.uid);
        } else {
          this.studentProfile.set(null);
        }
      });

      this.destroyRef.onDestroy(() => unsubscribe());
    });
  }

  // ── Public API ─────────────────────────────────────────────────────

  async loginWithGoogle(): Promise<void> {
    try {
      this.loginError.set(null);
      this.isLoading.set(true);
      const provider = new GoogleAuthProvider();

      // استخدام الـ Popup في كل البيئات لأنه الحل المثالي لـ Netlify
      const credential = await signInWithPopup(this.auth, provider);
      if (credential.user) {
        this.currentUser.set(credential.user);
        await this.fetchProfileFromFirestore(credential.user.uid);
      }
    } catch (error: any) {
      console.error('[Auth] Login error:', error);
      this.loginError.set(this.getReadableError(error?.code));
    } finally {
      this.isLoading.set(false);
    }
  }

  async completeOnboarding(
    selectedPath: Omit<StudentProfile, 'isConfigured'>,
  ): Promise<void> {
    const activeUser = this.currentUser();
    if (!activeUser) return;

    const fullProfile: StudentProfile = { ...selectedPath, isConfigured: true };

    try {
      const ref = doc(this.firestore, `students/${activeUser.uid}`);
      await setDoc(ref, fullProfile);
      this.studentProfile.set(fullProfile);

      const storeData = { id: activeUser.uid, ...fullProfile };
      const existing = await firstValueFrom(
        this.db.getByID('studentProfileStore', activeUser.uid).pipe(catchError(() => of(null)))
      );
      if (existing) {
        await firstValueFrom(this.db.update('studentProfileStore', storeData).pipe(catchError(() => of(null))));
      } else {
        await firstValueFrom(this.db.add('studentProfileStore', storeData).pipe(catchError(() => of(null))));
      }

      await this.router.navigate(['/main/student'], {
        state: {
          academicYear: fullProfile.academicYear,
          department: fullProfile.department
        }
      });
    } catch (error) {
      console.error('[Auth] Onboarding save error:', error);
    }
  }

  async logout(): Promise<void> {
    try {
      const activeUser = this.currentUser();
      if (activeUser) {
        await firstValueFrom(this.db.deleteByKey('studentProfileStore', activeUser.uid).pipe(catchError(() => of(null))));
      }
      await signOut(this.auth);
      this.studentProfile.set(null);
      await this.router.navigate(['/']);
    } catch (error) {
      console.error('[Auth] Logout error:', error);
    }
  }

  // ── Private ────────────────────────────────────────────────────────

  private async fetchProfileFromFirestore(uid: string): Promise<void> {
    try {
      const cached = await firstValueFrom(
        this.db.getByID<StudentProfile>('studentProfileStore', uid).pipe(catchError(() => of(null)))
      );

      if (cached) {
        this.studentProfile.set(cached);
        await this.router.navigate(['/main/student'], {
          state: {
            academicYear: cached.academicYear,
            department: cached.department
          }
        });
        return;
      }

      const ref      = doc(this.firestore, `students/${uid}`);
      const snapshot = await getDoc(ref);

      if (snapshot.exists()) {
        const data = snapshot.data() as StudentProfile;
        this.studentProfile.set(data);

        await firstValueFrom(
          this.db.add('studentProfileStore', { id: uid, ...data }).pipe(catchError(() => of(null)))
        );

        await this.router.navigate(['/main/student'], {
          state: {
            academicYear: data.academicYear,
            department: data.department
          }
        });
      } else {
        await this.router.navigate(['/main/student/setup-profile']);
      }
    } catch (error) {
      console.error('[Auth] Firestore fetch error:', error);
    }
  }

  private getReadableError(code?: string): string {
    const messages: Record<string, string> = {
      'auth/popup-blocked':           'المتصفح حجب النافذة — فعّل النوافذ المنبثقة',
      'auth/popup-closed-by-user':    'تم إغلاق نافذة تسجيل الدخول',
      'auth/cancelled-popup-request': 'طلب آخر جارٍ، انتظر لحظة',
      'auth/network-request-failed':  'تحقق من اتصالك بالإنترنت',
      'auth/too-many-requests':       'محاولات كثيرة، حاول لاحقاً',
      'auth/user-disabled':           'هذا الحساب معطّل',
    };
    return messages[code ?? ''] ?? 'حدث خطأ غير متوقع، حاول مرة أخرى';
  }
}