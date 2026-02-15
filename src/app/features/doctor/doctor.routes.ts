import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/Auth/Guards/permission-guard';
export const doctorRoutes: Routes = [
  {
    path: '',
    redirectTo: 'subjects',
    pathMatch: 'full',
  },
  {
    path: 'subjects',
    canActivate: [permissionGuard],
    data: {
      permission: 'RateFiles',
    },
    children: [
      {
        path: '',
        title: 'المواد الدراسية',
        loadComponent: () => import('./my-subjects/my-subjects').then((m) => m.MySubjects),
      },
      {
        path: ':curriculumId',

        children: [
          {
            path: '',
            redirectTo: 'files',
            pathMatch: 'full',
          },
          {
            path: 'files',
            title: 'الملفات',
            loadComponent: () => import('./files/files').then((m) => m.Files),
          },
          {
            path: 'rate/:fileId',
            title: 'تقييم الملف',
            loadComponent: () => import('./rate-file/rate-file').then((m) => m.RateFile),
          },
        ],
      },
    ],
  },
  {
    path: 'notifications',
    title: 'الاشعارات',
    canActivate: [permissionGuard],
    data: {
      permission: 'Notifications',
    },
    loadComponent: () =>
      import('./notification-list/notification-list').then((m) => m.NotificationList),
  },
];
