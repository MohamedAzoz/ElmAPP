import { Routes } from '@angular/router';

export const publicRoutes: Routes = [
  {
    path: '',
    title: 'الصفحة الرئيسية',
    loadComponent: () =>
      import('./student-dashboard/student-dashboard').then((m) => m.StudentDashboard),
    pathMatch: 'full',
  },
  {
    path: 'home-department',
    title: 'المواد الدراسية',
    loadComponent: () =>
      import('./Department/home-department/home-department').then((m) => m.HomeDepartment),
  },
  {
    path: 'curriculum',
    children: [
      {
        path: ':curriculumId',
        children: [
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
              import('./Videos/get-all-videos/get-all-videos').then((m) => m.GetAllVideos),
          },
          {
            path: 'C',
            title: 'Compiler',
            loadComponent: () => import('./Compiler/workspace/workspace').then((m) => m.Workspace),
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
                pathMatch: 'full',
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
                  import('./Tests/Components/start-test/start-test').then((m) => m.StartTest),
                pathMatch: 'full',
              },
              {
                path: ':questionId',
                loadComponent: () =>
                  import('./Tests/Components/test-session/test-session').then((m) => m.TestSession),
              },
            ],
          },
          {
            path: 'result',
            title: 'النتيجة',
            loadComponent: () => import('./Result_Exam/result/result').then((m) => m.Result),
          },
        ],
      },
    ],
  },
  {
    path: 'sections',
    children: [
      {
        path: '',
        title: 'السكاشن',
        loadComponent: () =>
          import('./Sections/get-all-sections/get-all-sections').then((m) => m.GetAllSections),
        pathMatch: 'full',
      },
      {
        path: ':sectionId/code-playground',
        title: 'تتبع الكود البرمجي والتجارب العملية',
        loadComponent: () =>
          import('./Sections/code-playground/code-playground').then((m) => m.CodePlayground),
      },
    ],
  },
  {
    title: 'مكتبتي',
    path: 'security-links',
    loadComponent: () =>
      import('./SecurityLinkValidator/security-link-validator/security-link-validator').then(
        (m) => m.SecurityLinkValidator,
      ),
  },
  {
    title: 'محرر الملفات',
    path: 'pdf-editor',
    loadComponent: () =>
      import('./PDF/pdf-editor-component/pdf-editor-component').then((m) => m.PdfEditorComponent),
  },
  {
    path: 'wrong-answers/:bankId',
    title: 'تفاصيل البنك',
    loadComponent: () =>
      import('./Wrong_Answers_Hub/wrong-answers/wrong-answers').then((m) => m.WrongAnswers),
  },
  {
    path: 'wrong-answers',
    title: 'مراجعة الاخطاء',
    loadComponent: () =>
      import('./Wrong_Answers_Hub/wrong-answers/wrong-answers').then((m) => m.WrongAnswers),
    pathMatch: 'full',
  },
  {
    path: 'saved-banks/questions',
    children: [
      {
        path: ':bankId',
        children: [
          {
            path: ':questionId',
            title: 'الأسئلة المحفوظة',
            loadComponent: () =>
              import('./Questions/get-all-questions/get-all-questions').then(
                (m) => m.GetAllQuestions,
              ),
          },
        ],
      },
    ],
  },
  {
    path: 'saved-banks/result',
    title: 'النتيجة',
    loadComponent: () => import('./Result_Exam/result/result').then((m) => m.Result),
  },
  {
    path: 'saved-banks',
    title: 'الأسئلة المحفوظة',
    loadComponent: () =>
      import('./QuestionBanks/offline-saved-question-banks/offline-saved-question-banks').then(
        (m) => m.OfflineSavedQuestionBanks,
      ),
    pathMatch: 'full',
  },
];
