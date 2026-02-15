import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/Auth/Guards/permission-guard';

export const adminRoutes: Routes = [
  { path: '', redirectTo: 'colleges', pathMatch: 'full' },
  {
    path: 'colleges',
    canActivate: [permissionGuard],
    data: {
      permission: 'Colleges',
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
    canActivate: [permissionGuard],
    data: {
      permission: 'Subjects',
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
        canActivate: [permissionGuard],
          data: {
          permission: 'Doctors',
        },
        loadComponent: () =>
          import('./user-management/Components/register-doctor/register-doctor').then(
            (m) => m.RegisterDoctor,
          ),
      },
      {
        path: 'leaders',
        title: 'ادارة القادة',
        canActivate: [permissionGuard],
        data: {
          permission: 'Leaders',
        },
        loadComponent: () =>
          import('./user-management/Components/register-student/register-student').then(
            (m) => m.RegisterStudent,
          ),
      },
      {
        path: 'user-permissions',
        title: 'ادارة صلاحيات المستخدم',
        canActivate: [permissionGuard],
        data: {
          permission: 'UserPermissions',
        },
        loadComponent: () =>
          import('./user-management/Components/user-permissions/user-permissions').then(
            (m) => m.UserPermissions,
          ),
      },
      {
        path: 'permissions',
        title: 'ادارة الصلاحيات',
        canActivate: [permissionGuard],
        data: {
          permission: 'Permissions',
        },
        loadComponent: () =>
          import('./user-management/Components/permissions/permissions').then((m) => m.Permissions),
      },
      {
        path: 'roles',
        canActivate: [permissionGuard],
        data: {
          permission: 'Roles',
        },
        children: [
          {
            path: '',
            title: 'ادارة الادوار',
            loadComponent: () =>
              import('./user-management/Components/roles/roles').then((m) => m.Roles),
          },
          {
            path: 'role-permissions',
            title: 'ادارة صلاحيات الادوار',
            canActivate: [permissionGuard],
            data: {
              permission: 'RolePermissions',
            },
            loadComponent: () =>
              import('./user-management/Components/role-permissions/role-permissions').then(
                (m) => m.RolePermissions,
              ),
          },
        ],  
      },
    ],
  },
];
