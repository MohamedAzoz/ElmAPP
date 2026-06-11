# SKILL.md - نظام إدارة وتوجيه الطلاب عبر Firebase (منصة عِلم)

## 📌 1. الهدف العام (Objective)

تحويل تجربة المستخدم (UX) في منصة "عِلم" من منصة مفتوحة عامة إلى منصة مخصصة وذكية موجهة للطالب بناءً على (الكليات، السنوات الدراسية، والأقسام). يتم ذلك عن طريق فصل مسار الطلاب العاديين (عبر تسجيل دخول فوري ومجاني بواسطة Google Auth) عن مسار أعضاء هيئة التدريس والمنظمين (الدكاترة والـ Leaders) الذين يستمرون في استخدام النظام التقليدي المرتبط بـ .NET Backend.

---

## 🛠️ 2. البنية البرمجية المستهدفة (Technical Stack & Architecture)

- **الفرونت إند:** Angular (v20) باستخدام **Angular Signals** لإدارة الحالة اللحظية.
- **إدارة الهوية والبيانات للطلاب:** \* **Firebase Authentication:** لتسجيل دخول الطلاب بـ Gmail (خطة Spark المجانية حتى 50,000 مستخدم نشط).
  - **Cloud Firestore:** قاعدة بيانات سحابية (NoSQL) لحفظ مستندات إعدادات الطلاب.
- **إدارة الإدارة والأعضاء:** .NET 9 API مخصص للدكاترة والـ Leaders (نظام تفويض عبر JWT).

---

## 🔄 3. مسار رحلة المستخدم (User Flow)

````

[الزائر يدخل الرابط الرئيسي: / ]
│
├──► (دكتور / ليدر) ──► يضغط "دخول الهيئة" ──► ينتقل لـ /faculty-login ──► تسجيل تقليدي (.NET JWT)
│
└──► (طالب عادي) ──► يضغط "ابدأ المذاكرة" (تسجيل جوجل الفوري)
│
▼
[التحقق من Firestore]
│
┌─────────────┴─────────────┐
▼                           ▼
[مستخدم جديد لأول مرة]      [مستخدم مسجل مسبقاً]
│                           │
وجهه لصفحة إعداد المسار      اقرأ مساره الأكاديمي المخزن
(/setup-profile)                │
│                           ▼
احفظ البيانات في Firestore    وجهه تلقائياً لمساره الخاص ومواده
│               (/:college/:year/:dept)
▼
وجهه لمساره الدراسي المخصص


---

## 📋 4. خطوات التنفيذ التقنية (Implementation Roadmap)

### الخطوة 1: تهيئة البيئة والربط اليدوي (Firebase Manual Configuration)

تم تثبيت الحزم المطلوبة يدوياً لتجنب مشاكل الصلاحيات في السكربتات التلقائية:

```bash
npm install @angular/fire firebase --save

````

تغذية ملفات الـ `environment.ts` بالـ Configuration Object المستخرج من Firebase Console، وإضافتها إلى مصفوفة الـ `providers` في ملف `app.config.ts`:

- `provideFirebaseApp(() => initializeApp(environment.firebase))`
- `provideAuth(() => getAuth())`
- `provideFirestore(() => getFirestore())`

### الخطوة 2: هيكلة البيانات في Cloud Firestore (Data Modeling)

يتم تخزين بيانات الطلاب في كولكشن أساسي باسم `students`، بحيث يكون اسم الـ Document هو الـ `uid` الفريد القادم من جوجل لكل مستخدم:

```json
// Collection: students | Document ID: user.uid
{
  "college": "1", // الكلية (مثال: حاسبات ومعلومات)
  "academicYear": "4", // السنة الدراسية (مثال: الرابعة)
  "department": "1", // القسم (مثال: علوم حاسب)
  "isConfigured": true // تأكيد إتمام إعداد الحساب بنجاح
}
```

### الخطوة 3: بناء الخدمة الذكية لإدارة الطلاب (`StudentAuthService`)

إنشاء خدمة تعتمد على الـ **Signals** لمراقبة حالة الطالب بشكل مستمر وتوجيهه تلقائياً:

- **`currentUser` (Signal):** يحمل بيانات حساب جوجل الحالي أو `null`.
- **`studentProfile` (Signal):** يحمل المسار الأكاديمي للطالب من الـ Firestore.
- **الدوال الأساسية:** `loginWithGoogle()`, `loadStudentProfile()`, `saveProfile()`, `logout()`.

### الخطوة 4: تطوير واجهات المستخدم (UI Implementation)

1. **الصفحة العامة (`HomeComponent`):** صفحة هبوط (Landing Page) تسويقية جذابة ومفتوحة للجميع. تحتوي على زر أساسي في المنتصف لاستدعاء الـ Google Auth، ورابط فرعي في الأعلى مخصص لنقل الدكاترة لصفحتهم السابقة.
2. **صفحة إعداد الملف (`SetupProfileComponent`):** واجهة بسيطة تحتوي على 3 قوائم منسدلة (Drop-downs) لاختيار (الكلية، السنة، القسم) تظهر للطالب الجديد مرة واحدة فقط في حياته البرمجية لتحديد مساره.

### الخطوة 5: حماية وتوجيه المسارات (`Router Guards`)

- بناء `student.guard.ts` لمنع تصفح مسارات المواد الكلية (`/:college/:year/:dept`) إلا إذا كان الطالب مسجلاً ومثبتاً لهويته عبر الـ Firebase.
- إعادة توجيه ذكية: عند محاولة الطالب المسجل الدخول للرابط العام `/` يتم قراءة الـ Signal الخاص ببياناته وتوجيهه فوراً إلى كليته لضمان عدم التشتت.

---

## 🚨 5. ضوابط الأمان والصلاحيات (Security Rules)

في مرحلة التطوير الحالية، تعمل قاعدة البيانات في وضع الاختبار (`Test Mode`). قبل الانتقال للإنتاج (Production)، يجب تحديث الـ Rules في Firebase Console لضمان أن كل طالب يمكنه فقط قراءة وتعديل الـ Document الخاص به بناءً على الـ `uid`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /students/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}

```
---

## 💻 6. مثال تطبيقي كامل (Code Example - Angular 20)
### 1) إعداد ملف البيئة (`src/environments/environment.ts`)
```typescript
export const environment = {
  production: false,
  firebase: {
    apiKey: "AIzaSyAsYourActualKeyHere...",
    authDomain: "elm-platform.firebaseapp.com",
    projectId: "elm-platform",
    storageBucket: "elm-platform.appspot.com",
    messagingSenderId: "1234567890",
    appId: "1:123456:web:abcdef"
  }
};

```

### 2) تسجيل الخدمات في (`src/app/app.config.ts`)

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';

// استيراد دوال التهيئة الحديثة من AngularFire
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';
import { environment } from '../environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    
    // تهيئة مصفوفة خدمات Firebase بشكل مستقل وضخها في التطبيق
    provideFirebaseApp(() => initializeApp(environment.firebase)),
    provideAuth(() => getAuth()),
    provideFirestore(() => getFirestore())
  ]
};

```

### 3) الخدمة الذكية لإدارة بيانات الطلاب واختياراتهم (`student-auth.service.ts`)

```typescript
import { inject, Injectable, signal } from '@angular/core';
import { Auth, GoogleAuthProvider, signInWithPopup, signOut, user, User } from '@angular/fire/auth';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';

// واجهة البيانات الخاصة بالمسار الدراسي للطالب
export interface StudentProfile {
  college: string;
  academicYear: string;
  department: string;
  isConfigured: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class StudentAuthService {
  // استخدام الـ inject البديل الحديث للـ Constructor Injection
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);

  // إشارات Angular Signals لإدارة الحالة بأعلى كفاءة أداء (Fine-grained reactivity)
  currentUser = signal<User | null>(null);
  studentProfile = signal<StudentProfile | null>(null);

  constructor() {
    // مراقبة حالة جلسة الدخول (Session) بشكل حي ومستمر
    user(this.auth).subscribe((firebaseUser) => {
      this.currentUser.set(firebaseUser);
      if (firebaseUser) {
        this.fetchProfileFromFirestore(firebaseUser.uid);
      } else {
        this.studentProfile.set(null);
      }
    });
  }

  // دالة تشغيل نافذة تسجيل الدخول بجوجل
  async loginWithGoogle(): Promise<void> {
    try {
      const provider = new GoogleAuthProvider();
      const credentials = await signInWithPopup(this.auth, provider);
      if (credentials.user) {
        await this.fetchProfileFromFirestore(credentials.user.uid);
      }
    } catch (error) {
      console.error('Firebase Auth Error:', error);
    }
  }

  // جلب بيانات المسار الأكاديمي للطالب من كولكشن Firestore
  private async fetchProfileFromFirestore(uid: string): Promise<void> {
    const documentReference = doc(this.firestore, `students/${uid}`);
    const documentSnapshot = await getDoc(documentReference);

    if (documentSnapshot.exists()) {
      const data = documentSnapshot.data() as StudentProfile;
      this.studentProfile.set(data);
      
      // توجيه ذكي مباشر للمسار الخاص بالطالب لتجنب عشوائية التصفح
      this.router.navigate([`/${data.college}/${data.academicYear}/${data.department}`]);
    } else {
      // مستخدم جديد بالكامل يتم نقله لإدخال كليته وقسمه لأول مرة
      this.router.navigate(['/setup-profile']);
    }
  }

  // حفظ بيانات الكلية وتثبيت الحساب لأول مرة
  async completeOnboarding(selectedPath: Omit<StudentProfile, 'isConfigured'>): Promise<void> {
    const activeUser = this.currentUser();
    if (!activeUser) return;

    const fullProfile: StudentProfile = {
      ...selectedPath,
      isConfigured: true
    };

    const documentReference = doc(this.firestore, `students/${activeUser.uid}`);
    
    // حفظ المستند في Firestore (سيقوم بإنشاء الكولكشن والمستند تلقائياً إن لم يتواجدوا)
    await setDoc(documentReference, fullProfile);
    this.studentProfile.set(fullProfile);

    // التوجيه الفوري بعد الحفظ للمحتوى الدراسي
    this.router.navigate([`/${fullProfile.college}/${fullProfile.academicYear}/${fullProfile.department}`]);
  }

  // تسجيل الخروج وإعادة الطالب لصفحة الهبوط العامة
  async logout(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/']);
  }
}

```





