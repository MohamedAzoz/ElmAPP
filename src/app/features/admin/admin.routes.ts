import { Routes } from '@angular/router';
import { roleGuard } from '../../core/Auth/Guards/role-guard';
import { Roles } from '../../core/Const/Roles';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'colleges', pathMatch: 'full' },
  {
    path: 'colleges',
    canActivate: [roleGuard],
    data: {
      role: [Roles.SuperAdmin],
    },
    children: [
      {
        path: '',
        title: 'ادارة الكليات',
        loadComponent: () =>
          import('./management/Colleges/Components/get-all-colleges-for-admin/get-all-colleges-for-admin').then(
            (m) => m.GetAllCollegesForAdmin,
          ),
      },
      {
        path: ':collegeId',
        children: [
          {
            path: '',
            title: 'ادارة السنوات',
            loadComponent: () =>
              import('./management/Year/Components/get-all-years-for-admin/get-all-years-for-admin').then(
                (m) => m.GetAllYearsForAdmin,
              ),
          },
          {
            path: 'departments',
            title: 'ادارة الاقسام',
            loadComponent: () =>
              import('./management/Department/Components/get-all-departments-for-admin/get-all-departments-for-admin').then(
                (m) => m.GetAllDepartmentsForAdmin,
              ),
          },
        ],
      },
    ],
  },
  {
    path: 'subjects',
    canActivate: [roleGuard],
    data: {
      role: [Roles.SuperAdmin],
    },
    children: [
      {
        path: '',
        title: 'ادارة المواد',
        loadComponent: () =>
          import('./management/Subjects/Components/get-all-subjects-for-admin/get-all-subjects-for-admin').then(
            (m) => m.GetAllSubjectsForAdmin,
          ),
      },
      {
        path: ':subjectId/curriculums',
        title: 'ادارة المناهج',
        loadComponent: () =>
          import('./management/Curriulums/Components/get-all-curriulums-for-admin/get-all-curriulums-for-admin').then(
            (m) => m.GetAllCurriulumsForAdmin,
          ),
      },
    ],
  },
  {
    path: 'management',
    children: [
      {
        path: '',
        title: 'ادارة الدكاترة',
        canActivate: [roleGuard],
        data: {
          permission: [Roles.SuperAdmin],
        },
        loadComponent: () =>
          import('./user-management/Components/register-doctor/register-doctor').then(
            (m) => m.RegisterDoctor,
          ),
      },
      {
        path: 'leaders',
        title: 'ادارة القادة',
        canActivate: [roleGuard],
        data: {
          role: [Roles.SuperAdmin],
        },
        loadComponent: () =>
          import('./user-management/Components/register-student/register-student').then(
            (m) => m.RegisterStudent,
          ),
      },
    ],
  },
  {
    path: 'settings',
    canActivate: [roleGuard],
    data: {
      role: [Roles.SuperAdmin],
    },
    children: [
      {
        path: '',
        title: 'ادارة الاعدادات',
        loadComponent: () => import('./management/Setting/setting/setting').then((m) => m.Setting),
      },
    ],
  },
];
