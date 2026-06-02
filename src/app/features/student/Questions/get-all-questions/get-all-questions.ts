import { Component, inject, OnInit, OnDestroy, computed, signal, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionFacade } from '../question-facade';
import { QuizStateService } from '../../Result_Exam/quiz-state-service';
import { QuestionCarde } from '../../../../shared/Components/question-carde/question-carde';
import { ProgressBarModule } from 'primeng/progressbar';
import { ConfirmationService, MessageService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { toSignal } from '@angular/core/rxjs-interop';
import { SelectButtonModule } from 'primeng/selectbutton';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { KeyboardNavigation } from '../../../../shared/Directives/keyboard-navigation';

@Component({
  selector: 'app-get-all-questions',
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    ProgressBarModule,
    ConfirmDialogModule,
    QuestionCarde,
    SelectButtonModule,
    FormsModule,
    KeyboardNavigation,
  ],
  providers: [ConfirmationService],
  templateUrl: './get-all-questions.html',
  styleUrl: './get-all-questions.css',
})
export class GetAllQuestions implements OnInit, OnDestroy {
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private questionFacade = inject(QuestionFacade);
  quizState = inject(QuizStateService);

  questions = this.questionFacade.questions;
  isLoading = this.questionFacade.isLoading;

  // 1. تحديد المعايير القادمة من الرابط مباشرة كـ Signals
  private params = toSignal(this.route.paramMap);
  private bankId = computed(() => Number(this.params()?.get('bankId')));
  private questionIdFromUrl = computed(() => Number(this.params()?.get('questionId')));
  isTestMode = signal('ltr');
  // 2. حساب الـ Index بناءً على الـ ID الموجود في الرابط
  currentIndex = computed(() => {
    const id = this.questionIdFromUrl();
    const index = this.questions().findIndex((q: any) => q.id === id);
    // إذا لم يجد السؤال (مثلاً عند أول تحميل)، نرجع 0
    return index !== -1 ? index : 0;
  });

  // 3. السؤال الحالي يُجلب مباشرة من المصفوفة باستخدام الـ Index المحسوب
  currentQuestion = computed(() => {
    const questionsList = this.questions();
    const index = this.currentIndex();
    return questionsList.length > 0 ? questionsList[index] : null;
  });

  isLastQuestion = computed(() => this.currentIndex() === this.questions().length - 1);
  isFirstQuestion = computed(() => this.currentIndex() === 0);

  progress = computed(() => {
    if (this.questions().length === 0) return 0;
    return ((this.currentIndex() + 1) / this.questions().length) * 100;
  });

  constructor() {
    // الـ effect وظيفته فقط جلب البيانات إذا تغير الـ bankId
    effect(() => {
      const bId = this.bankId();
      if (bId) {
        // نجلب الأسئلة فقط إذا لم تكن موجودة أو تغير البنك
        this.questionFacade.getQuestionsByBankId(bId);
      }
    });
  }

  ngOnInit() {
    // Check if the page is being reloaded
    const navigationEntries = window.performance.getEntriesByType('navigation');
    const isReload =
      navigationEntries.length > 0 &&
      (navigationEntries[0] as PerformanceNavigationTiming).type === 'reload';

    if (!isReload) {
      // Clear old bank quiz data to start fresh if it's a new entry
      this.quizState.clearBankQuiz();
      this.questionFacade.questions.set([]);
    }
    // Set isBankTest to true so the correct answers map is retrieved/saved
    this.quizState.isBankTest.set(true);

    this.quizState.startTimer();
  }

  ngOnDestroy() {
    this.quizState.clearBankQuiz();
    this.questionFacade.questions.set([]);
  }

  // التنقل يعتمد على إرسال الـ ID الجديد للرابط فقط
  next() {
    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < this.questions().length) {
      const nextId = this.questions()[nextIndex].id;
      this.navigateToQuestion(nextId!);
    }
  }

  prev() {
    const prevIndex = this.currentIndex() - 1;
    if (prevIndex >= 0) {
      const prevId = this.questions()[prevIndex].id;
      this.navigateToQuestion(prevId!);
    }
  }

  navigateToQuestion(id: number) {
    // بما أننا في المسار :bankId/:questionId
    // الانتقال لـ '../' + id سيبدل الـ questionId ويحافظ على الـ bankId
    this.router.navigate(['../', id], {
      relativeTo: this.route,
      replaceUrl: true, // اختياري: لمنع تراكم تاريخ المتصفح عند كل سؤال
    });
  }

  onAnswerSelected(optionId: number) {
    const qId = this.currentQuestion()?.id;
    if (qId) {
      this.quizState.saveBankAnswer(qId, optionId);
    }
  }

  selectOptionByIndex(index: number) {
    const question = this.currentQuestion();
    if (question && question.options && question.options[index]) {
      const optionId = question.options[index].id;
      if (optionId !== undefined) {
        this.onAnswerSelected(optionId);
      }
    }
  }

  onSubmitKeyboard() {
    if (this.isLastQuestion()) {
      this.confirmEnd();
    }
  }

  confirmEnd(event?: Event) {
    this.confirmationService.confirm({
      target: event?.target as EventTarget,
      message: 'هل أنت متأكد من إنهاء الامتحان؟ سيتم احتساب النتيجة فوراً.',
      header: 'تأكيد الإنهاء',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'نعم، أنهِ الامتحان',
      rejectLabel: 'إلغاء',
      accept: () => {
        this.quizState.saveTestResult(this.questions(), true);
        this.messageService.add({
          severity: 'success',
          summary: 'تم الحفظ',
          detail: 'جاري التحويل...',
        });

        setTimeout(() => {
          this.router.navigate(['../../../result'], { relativeTo: this.route });
        }, 750);
      },
    });
  }
}
