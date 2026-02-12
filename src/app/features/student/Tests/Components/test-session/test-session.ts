import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimengBtnModule } from '../../../../../shared/Models/primeng-btn/primeng-btn-module';
import { QuestionCarde } from '../../../../../shared/Components/question-carde/question-carde';
import { QuizStateService } from '../../../Result_Exam/quiz-state-service';
import { TestFacade } from '../../test-facade';
import { ResultOfTestResultDto, SubmitTestCommand } from '../../../../../core/api/clients';
import { GlobalService } from '../../../../../core/Services/global-service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-test-session',
  imports: [PrimengBtnModule, QuestionCarde],
  templateUrl: './test-session.html',
  styleUrl: './test-session.scss',
})
export class TestSession implements OnInit {
  testFacade = inject(TestFacade);
  quizState = inject(QuizStateService);
  title = inject(GlobalService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  data = this.testFacade.currentTestData;
  currentQuesId = signal<number>(0);
  markedQuestions = signal<Set<number>>(new Set());
  // تم تعديل الـ computed ليعتمد بشكل صارم على الـ ID الحالي
  currentQuestion = computed(() => {
    const questions = this.data()?.questions || [];
    const id = this.currentQuesId();
    return questions.find((q) => q.id === id) || questions[0];
  });

  private params = toSignal(this.route.paramMap);
  private questionId = computed(() => Number(this.params()?.get('questionId')));

  constructor() {
    effect(() => {
      const id = this.questionId();
      if (id) {
        this.currentQuesId.set(id);
      }
    });
  }

  ngOnInit() {
    this.title.setTitle('الاختبار');
    // استعادة الجلسة عند الرفريش
    if (!this.data() && localStorage.getItem('current_session')) {
      this.testFacade.currentTestData.set(JSON.parse(localStorage.getItem('current_session')!));
    }

    const testData = this.data();
    if (testData?.expiresAt) {
      this.quizState.startCountdown(testData.expiresAt);
      localStorage.setItem('current_session', JSON.stringify(testData));
    }
  }

  jumpTo(id: number) {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  getCurrentIndex(): number {
    const questions = this.data()?.questions || [];
    const id = this.currentQuesId();
    return questions.findIndex((q) => q.id === id);
  }

  jumpToNext() {
    const questions = this.data()?.questions || [];
    const index = this.getCurrentIndex();
    if (index !== -1 && index < questions.length - 1) {
      this.jumpTo(questions[index + 1].id!);
    }
  }

  jumpToPrev() {
    const questions = this.data()?.questions || [];
    const index = this.getCurrentIndex();
    if (index > 0) {
      this.jumpTo(questions[index - 1].id!);
    }
  }

  isAnswered(qId: number): boolean {
    return !!this.quizState.getAnswer(qId);
  }

  toggleBookmark(qId: number) {
    this.markedQuestions.update((set) => {
      const newSet = new Set(set);
      newSet.has(qId) ? newSet.delete(qId) : newSet.add(qId);
      return newSet;
    });
  }

  isMarked(qId: number): boolean {
    return this.markedQuestions().has(qId);
  }

  finishTest() {
    const answers = Array.from(this.quizState.userAnswers().entries()).map(([qId, optId]) => ({
      questionId: qId,
      selectedOptionIds: [optId],
    }));

    const command: SubmitTestCommand = {
      testSessionId: this.data()?.testSessionId!,
      answers: answers,
    };
    this.testFacade.submitTest(command).subscribe({
      next: (res: ResultOfTestResultDto) => {
        this.quizState.saveTestResult(res.data);
        this.quizState.stopTimer();
        localStorage.removeItem('current_session');
        this.router.navigate(['../../result'], { relativeTo: this.route });
      },
      error: (err) => {
        console.error('فشل إنهاء الاختبار', err);
      },
    });
  }
}
