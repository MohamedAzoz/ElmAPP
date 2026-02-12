import { Routes } from '@angular/router';
import { authGuard } from './core/Auth/Guards/auth-guard';
import { guestGuard } from './core/Auth/Guards/guest-guard';
// import { adminGuard } from './core/Auth/Guards/admin-guard';

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
        loadComponent: () =>
          import('./features/auth/components/log-in/log-in').then((m) => m.LogIn),
        canActivate: [guestGuard],
      },
      {
        path: 'home',
        loadComponent: () => import('./shared/Components/home/home').then((m) => m.Home),
        canActivate: [authGuard],
      },
      {
        path: 'changePassword',
        loadComponent: () =>
          import('./features/auth/components/change-password/change-password').then(
            (m) => m.ChangePassword,
          ),
        canActivate: [authGuard],
      },
      {
        path: 'admin',
        loadChildren: () => import('./features/admin/admin.routes').then((m) => m.adminRoutes),
        canActivate: [authGuard],
      },
      {
        path: 'doctor',
        loadChildren: () => import('./features/doctor/doctor.routes').then((m) => m.doctorRoutes),
        canActivate: [authGuard],
      },
      {
        path: 'leader',
        loadChildren: () => import('./features/leader/leader.routes').then((m) => m.leaderRoutes),
        canActivate: [authGuard],
      },
    ],
  },
  {
    path: 'access-denied',
    loadComponent: () =>
      import('./shared/Components/access-denied/access-denied').then((m) => m.AccessDenied),
  },
  { path: '**', redirectTo: 'notfound' },
  {
    path: 'notfound',
    loadComponent: () => import('./shared/Components/notfound/notfound').then((m) => m.Notfound),
  },
];
