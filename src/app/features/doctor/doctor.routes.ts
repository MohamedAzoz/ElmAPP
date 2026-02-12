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
    canActivate:[permissionGuard],
    data: {
      permission: 'RateFiles',
    },
    children: [
      {
        path: '',
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
            loadComponent: () => import('./files/files').then((m) => m.Files),
          },
          {
            path: 'rate/:fileId',
            loadComponent: () => import('./rate-file/rate-file').then((m) => m.RateFile),
          },
        ],
      },
    ],
  },
  {
    path: 'notifications',
    canActivate:[permissionGuard],
    data: {
      permission: 'Notifications',
    },
    loadComponent: () =>
      import('./notification-list/notification-list').then((m) => m.NotificationList),
  },
];
