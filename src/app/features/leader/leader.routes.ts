import { Routes } from '@angular/router';
import { permissionGuard } from '../../core/Auth/Guards/permission-guard';

export const leaderRoutes: Routes = [
  { path: '', redirectTo: 'my-subjects', pathMatch: 'full' },
  {
    path: 'my-subjects',
    canActivate: [permissionGuard],
    children: [
      {
        path: '',
        title: 'المواد الدراسية',
        loadComponent: () =>
          import('./Curriulums/my-subjects/my-subjects').then((m) => m.MySubjects),
      },
      {
        path: ':curriculumId',
        data: {
          permission: 'QuestionBanks&Files',
        },
        canActivate: [permissionGuard],
        children: [
          {
            path: '',
            title: 'الموارد',
            loadComponent: () => import('./resource/resource').then((m) => m.Resource),
          },
          {
            path: 'questionBanks',
            data: {
              permission: 'QuestionBanks',
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
            data: {
              permission: 'Files',
            },
          },
        ],
      },
    ],
  },
];
