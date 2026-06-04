import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  { path: '', redirectTo: 'colleges', pathMatch: 'full' },
  {
    path: 'colleges',
    children: [
      {
        path: '',
        title: 'الكليات المتاحة',
        loadComponent: () => import('./Universty/home/home').then((m) => m.Home),
      },
      {
        path: ':collegeId/years',
        children: [
          {
            path: '',
            title: 'المستويات الدراسية',
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
                path: ':departmentId/sections',
                children: [
                  {
                    path: '',
                    title: 'السكاشن',
                    loadComponent: () =>
                      import('./Sections/get-all-sections/get-all-sections').then(
                        (m) => m.GetAllSections,
                      ),
                  },
                  {
                    path: ':sectionId/code-playground',
                    title: 'تتبع الكود البرمجي والتجارب العملية',
                    loadComponent: () =>
                      import('./Sections/code-playground/code-playground').then(
                        (m) => m.CodePlayground,
                      ),
                  },
                  {
                    path: ':curriculumId/F',
                    title: 'الملخصات',
                    loadComponent: () =>
                      import('./Files/get-all-files/get-all-files').then(
                        (m) => m.GetAllFiles,
                      ),
                  },
                  {
                    path: ':curriculumId/V',
                    title: 'فيديوهات الشرح',
                    loadComponent: () =>
                      import('./Videos/get-all-videos/get-all-videos').then(
                        (m) => m.GetAllVideos,
                      ),
                  },
                ],
              },
              {
                path: ':departmentId/curriulums',
                children: [
                  {
                    path: '',
                    title: 'المناهج الدراسية',
                    loadComponent: () =>
                      import('./Department/home-department/home-department').then(
                        (m) => m.HomeDepartment,
                      ),
                  },
                  {
                    path: ':curriculumId',
                    children: [
                      {
                        path: '',
                        redirectTo: 'F',
                        pathMatch: 'full',
                      },
                      {
                        path: 'F',
                        title: 'الملخصات',
                        loadComponent: () =>
                          import('./Files/get-all-files/get-all-files').then((m) => m.GetAllFiles),
                      },
                      {
                        path: 'V',
                        title: 'فيديوهات الشرح',
                        loadComponent: () =>
                          import('./Videos/get-all-videos/get-all-videos').then(
                            (m) => m.GetAllVideos,
                          ),
                      },
                      {
                        path: 'C',
                        title: 'Compiler',
                        loadComponent: () =>
                          import('./Compiler/workspace/workspace').then((m) => m.Workspace),
                      },
                      {
                        path: 'QB',
                        children: [
                          {
                            path: '',
                            title: 'بنوك الأسئلة',
                            loadComponent: () =>
                              import('./QuestionBanks/get-all-question-banks/get-all-question-banks').then(
                                (m) => m.GetAllQuestionBanks,
                              ),
                          },
                          {
                            path: ':bankId/:questionId',
                            title: 'الأسئلة',
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
  // PdfEditorComponent
  {
    title: 'محرر الملفات',
    path: 'pdf-editor',
    loadComponent: () => import('./PDF/pdf-editor-component/pdf-editor-component').then((m) => m.PdfEditorComponent),
  },
];
