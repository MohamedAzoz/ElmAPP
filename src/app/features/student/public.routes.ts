import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  { path: '', redirectTo: 'colleges', pathMatch: 'full' },
  {
    path: 'colleges',
    children: [
      {
        path: '',
        title: 'الجامعات',
        loadComponent: () => import('./Universty/home/home').then((m) => m.Home),
      },
      {
        path: ':collegeId/years',
        children: [
          {
            path: '',
            title: 'السنوات',
            loadComponent: () =>
              import('./Colleges/home-college/home-college').then((m) => m.HomeCollege),
          },
          {
            path: ':yearId/departments',
            children: [
              {
                path: '',
                title: 'الاقسام',
                loadComponent: () => import('./Year/home-year/home-year').then((m) => m.HomeYear),
              },
              {
                path: ':departmentId/curriulums', // لا تكرر yearId هنا، هو مأخوذ من الأب
                children: [
                  {
                    path: '',
                    title: 'المناهج',
                    loadComponent: () =>
                      import('./Department/home-department/home-department').then(
                        (m) => m.HomeDepartment,
                      ),
                  },
                  {
                    path: ':curriculumId', // المسار يصبح: .../curriulums/5
                    children: [
                      {
                        path: '',
                        title: 'المصادر',
                        loadComponent: () =>
                          import('./Curriulums/home-curriulum/home-curriulum').then(
                            (m) => m.HomeCurriulum,
                          ),
                      },
                      {
                        path: 'F',
                        title: 'الملخصات',
                        loadComponent: () =>
                          import('./Files/get-all-files/get-all-files').then((m) => m.GetAllFiles),
                      },
                      {
                        path: 'QB',
                        children: [
                          {
                            path: '',
                            title: 'بنك الاسئلة',
                            loadComponent: () =>
                              import('./QuestionBanks/get-all-question-banks/get-all-question-banks').then(
                                (m) => m.GetAllQuestionBanks,
                              ),
                          },
                          {
                            path: ':bankId/:questionId',
                            title: 'الاسئلة',
                            loadComponent: () =>
                              import('./Questions/get-all-questions/get-all-questions').then(
                                (m) => m.GetAllQuestions,
                              ),
                          },
                        ],
                      },
                      {
                        path: 'T',
                        children: [
                          {
                            path: '',
                            loadComponent: () =>
                              import('./Tests/Components/start-test/start-test').then(
                                (m) => m.StartTest,
                              ),
                          },
                          {
                            path: ':questionId',
                            loadComponent: () =>
                              import('./Tests/Components/test-session/test-session').then(
                                (m) => m.TestSession,
                              ),
                          },
                        ],
                      },
                      {
                        path: 'result',
                        title: 'النتيجة',
                        loadComponent: () =>
                          import('./Result_Exam/result/result').then((m) => m.Result),
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
];
