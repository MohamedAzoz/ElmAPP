import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimengBtnModule } from '../../../../../shared/Models/primeng-btn/primeng-btn-module';
import { QuestionCarde } from '../../../../../shared/Components/question-carde/question-carde';
import { QuizStateService } from '../../../Result_Exam/quiz-state-service';
import { TestFacade } from '../../test-facade';
import { GlobalService } from '../../../../../core/Services/global-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { LocalStorage } from '../../../../../core/Services/local-storage';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';

@Component({
  selector: 'app-test-session',
  imports: [PrimengBtnModule, QuestionCarde, FormsModule, SelectButtonModule],
  templateUrl: './test-session.html',
  styleUrl: './test-session.scss',
})
export class TestSession implements OnInit {
  testFacade = inject(TestFacade);
  quizState = inject(QuizStateService);
  title = inject(GlobalService);
  private route = inject(ActivatedRoute);
  private localStorage = inject(LocalStorage);
  private router = inject(Router);

  // البيانات هي مصفوفة الأسئلة مباشرة كما في الـ Facade
  data = this.testFacade.currentTestData;
  currentQuesId = signal<number>(0);
  markedQuestions = signal<Set<number>>(new Set());
  dir = signal<string>('ltr');
  // المرجع الحالي للسؤال المعروض
  currentQuestion = computed(() => {
    const questions = this.data() || [];
    const id = this.currentQuesId();
    return questions.find((q) => q.id === id) || questions[0];
  });

  private params = toSignal(this.route.paramMap);
  private questionId = computed(() => Number(this.params()?.get('questionId')));
  endTest = signal<boolean>(false);
  constructor() {
    effect(() => {
      const id = this.questionId();
      if (id) {
        this.currentQuesId.set(id);
        if (this.quizState.timerTest() === '00:00') {
          this.finishTest();
        }
      }
    });
  }

  ngOnInit() {
    this.title.setTitle('الاختبار');
    const totalTestDurationSeconds = (this.data()?.length || 0) * 120;

    this.quizState.startCountdown(totalTestDurationSeconds);

    if (this.data().length === 0 && this.localStorage.get('current_session')) {
      const savedData = this.localStorage.get('current_session');
      this.testFacade.currentTestData.set(savedData);
    }
  }

  getCurrentIndex(): number {
    const questions = this.data() || [];
    const id = this.currentQuesId();
    return questions.findIndex((q) => q.id === id);
  }

  jumpTo(id: number) {
    this.router.navigate(['../', id], { relativeTo: this.route });
  }

  jumpToNext() {
    const questions = this.data();
    const index = this.getCurrentIndex();
    if (index !== -1 && index < questions.length - 1) {
      this.jumpTo(questions[index + 1].id);
    }
  }

  jumpToPrev() {
    const questions = this.data();
    const index = this.getCurrentIndex();
    if (index > 0) {
      this.jumpTo(questions[index - 1].id);
    }
  }

  // دالة مطلوبة للـ HTML لتلوين الخلية إذا تم الإجابة عليها
  isAnswered(qId: number): boolean {
    return !!this.quizState.getAnswer(qId);
  }

  // دالة مطلوبة للـ HTML للتحقق من وجود علامة المراجعة
  isMarked(qId: number): boolean {
    return this.markedQuestions().has(qId);
  }

  toggleBookmark(qId: number) {
    this.markedQuestions.update((set) => {
      const newSet = new Set(set);
      newSet.has(qId) ? newSet.delete(qId) : newSet.add(qId);
      return newSet;
    });
  }

  finishTest() {
    const questions = this.data();
    const userAnswers = this.quizState.userAnswers();
    let correctCount = 0;

    const details = questions.map((q) => {
      const selectedOptionId = userAnswers.get(q.id);
      const correctOption = q.options.find((o) => o.isCorrect === true);

      // البحث عن نص الخيار الذي اختاره المستخدم
      const selectedOption = q.options.find((o) => o.id === selectedOptionId);
      const isRight = selectedOptionId === correctOption?.id;

      if (isRight) correctCount++;

      return {
        questionId: q.id,
        content: q.content, // نص السؤال
        selectedOptionContent: selectedOption?.content || 'لم يتم الإجابة', // نص إجابة الطالب
        correctOptionContent: correctOption?.content, // نص الإجابة الصحيحة
        isCorrect: isRight,
      };
    });

    const finalResult = {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      gradePercentage: questions.length > 0 ? (correctCount / questions.length) * 100 : 0,
      details: details,
    };

    this.quizState.saveTestResult(finalResult);
    this.quizState.stopTimer();
    this.localStorage.remove('current_session');
    this.router.navigate(['../../result'], { relativeTo: this.route });
  }
}
