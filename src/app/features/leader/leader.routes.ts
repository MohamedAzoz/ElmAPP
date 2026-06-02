import { Routes } from '@angular/router';

import { Roles } from '../../core/Const/Roles';
import { roleGuard } from '../../core/Auth/Guards/role-guard';
export const leaderRoutes: Routes = [
  { path: '', redirectTo: 'my-subjects', pathMatch: 'full' },
  {
    path: 'my-subjects',
    canActivate: [roleGuard],
    data: {
      role: [Roles.Leader],
    },
    children: [
      {
        path: '',
        title: 'المواد الدراسية',
        loadComponent: () =>
          import('./Curriulums/my-subjects/my-subjects').then((m) => m.MySubjects),
      },
      {
        path: ':curriculumId',
        canActivate: [roleGuard],
        data: {
          role: [Roles.Leader],
        },
        children: [
          {
            path: '',
            title: 'الموارد',
            loadComponent: () => import('./resource/resource').then((m) => m.Resource),
          },
          {
            path: 'questionBanks',
            canActivate: [roleGuard],
            data: {
              role: [Roles.Leader],
            },
            children: [
              {
                path: '',
                title: 'بنوك الاسئلة',
                loadComponent: () =>
                  import('./QuestionBanks/get-all-question-banks-for-leader/get-all-question-banks-for-leader').then(
                    (m) => m.GetAllQuestionBanksForLeader,
                  ),
              },
              {
                path: ':questionBankId',
                children: [
                  { path: '', redirectTo: 'questions', pathMatch: 'full' },
                  {
                    path: 'questions',
                    title: 'الاسئلة',
                    loadComponent: () =>
                      import('./Questions/Components/get-all-questions-for-leader/get-all-questions-for-leader').then(
                        (m) => m.GetAllQuestionForLeader,
                      ),
                  },
                ],
              },
            ],
          },
          {
            path: 'files',
            title: 'الملخصات',
            loadComponent: () =>
              import('./Files/get-all-files-for-leader/get-all-files-for-leader').then(
                (m) => m.GetAllFilesForLeader,
              ),
            canActivate: [roleGuard],
            data: {
              role: [Roles.Leader],
            },
          },
        ],
      },
    ],
  },
];
