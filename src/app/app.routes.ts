import { Routes } from '@angular/router';
import { authGuard } from './core/Auth/Guards/auth-guard';
import { guestGuard } from './core/Auth/Guards/guest-guard';

export const routes: Routes = [
  { path: '', redirectTo: 'main', pathMatch: 'full' },
  {
    path: 'main',
    loadComponent: () => import('./shared/Components/main/main').then((m) => m.Main),
    children: [
      {
        path: '',
        loadChildren: () => import('./features/student/public.routes').then((m) => m.publicRoutes),
      },
      {
        path: 'login',
        title: 'تسجيل الدخول',
        loadComponent: () =>
          import('./features/auth/components/log-in/log-in').then((m) => m.LogIn),
        canActivate: [guestGuard],
      },
      {
        path: 'home',
        title: 'الرئيسية',
        loadComponent: () => import('./shared/Components/home/home').then((m) => m.Home),
        canActivate: [authGuard],
      },
      {
        path: 'changePassword',
        title: 'تغيير كلمة المرور',
        loadComponent: () =>
          import('./features/auth/components/change-password/change-password').then(
            (m) => m.ChangePassword,
          ),
        canActivate: [authGuard],
      },
      {
        path: 'admin',
        title: 'لوحة تحكم الأدمن',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
        canActivate: [authGuard],
      },
      {
        path: 'doctor',
        title: 'لوحة الدكتور',
        loadChildren: () => import('./features/doctor/doctor.routes').then((m) => m.doctorRoutes),
        canActivate: [authGuard],
      },
      {
        path: 'leader',
        title: 'لوحة القائد',
        loadChildren: () => import('./features/leader/leader.routes').then((m) => m.leaderRoutes),
        canActivate: [authGuard],
      },
    ],
  },

  {
    path: 'access-denied',
    title: 'غير مصرح',
    loadComponent: () =>
      import('./shared/Components/access-denied/access-denied').then((m) => m.AccessDenied),
  },
  {
    path: 'notfound',
    title: 'الصفحة غير موجودة',
    loadComponent: () => import('./shared/Components/notfound/notfound').then((m) => m.Notfound),
  },
  { path: '**', redirectTo: 'notfound' },
];
