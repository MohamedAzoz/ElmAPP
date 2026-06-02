import { Component, inject, OnInit, computed, signal, effect } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { QuestionCarde } from '../../../../../shared/Components/question-carde/question-carde';
import { QuizStateService } from '../../../Result_Exam/quiz-state-service';
import { TestFacade } from '../../test-facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { LocalStorage } from '../../../../../core/Services/local-storage';
import { FormsModule } from '@angular/forms';
import { SelectButtonModule } from 'primeng/selectbutton';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TooltipModule } from 'primeng/tooltip';
import { KeyboardNavigation } from '../../../../../shared/Directives/keyboard-navigation';

@Component({
  selector: 'app-test-session',
  imports: [
    CommonModule,
    ButtonModule,
    TooltipModule,
    QuestionCarde,
    FormsModule,
    SelectButtonModule,
    KeyboardNavigation,
  ],
  templateUrl: './test-session.html',
  styleUrl: './test-session.css',
})
export class TestSession implements OnInit {
  testFacade = inject(TestFacade);
  quizState = inject(QuizStateService);
  private route = inject(ActivatedRoute);
  private localStorage = inject(LocalStorage);
  private router = inject(Router);

  data = this.testFacade.currentTestData;
  currentQuesId = signal<number>(0);
  markedQuestions = signal<Set<number>>(new Set());
  dir = signal<string>('ltr');
  screenSize = signal<number>(window.innerWidth);
  currentQuestion = computed(() => {
    const questions = this.data() || [];
    const id = this.currentQuesId();
    return questions.find((q) => q.id === id) || questions[0];
  });

  private params = toSignal(this.route.paramMap);
  private questionId = computed(() => Number(this.params()?.get('questionId')));
  endTest = signal<boolean>(false);

  constructor() {
    // Effect 1: مراقبة تغيير الـ ID في الرابط
    effect(() => {
      const id = this.questionId();
      if (id) {
        this.currentQuesId.set(id);
      }
    });

    // Effect 2: مراقبة الوقت لإنهاء الاختبار تلقائياً
    effect(() => {
      const timeLeft = this.quizState.timeLeft();
      const questionsLoaded = this.data()?.length > 0;

      // إذا وصل الوقت لصفر وكان الاختبار قد بدأ فعلاً (يوجد أسئلة)
      if (questionsLoaded && timeLeft === 0) {
        // التأكد من أن العداد انتهى فعلياً وليس مجرد حالة ابتدائية
        const expiryTime = Number(this.localStorage.get('quiz_timer_expire'));
        if (expiryTime && Date.now() >= expiryTime) {
          this.finishTest();
        }
      }
    });
  }
  ngOnInit() {
    // Set isBankTest to false so we are in the real exam session context
    this.quizState.isBankTest.set(false);
    // استعادة البيانات إذا حدث Refresh
    if (this.data().length === 0 && this.localStorage.get('current_session')) {
      const savedData = this.localStorage.get('current_session');
      this.testFacade.currentTestData.set(savedData);
    }

    const questions = this.data() || [];
    if (questions.length > 0) {
      const totalTestDurationSeconds = questions.length * 120;
      this.quizState.startCountdown(totalTestDurationSeconds);
      this.testFacade.setTotalTestDurationSeconds(totalTestDurationSeconds);

      const timeNow = Date.now();
      this.testFacade.endDuration(timeNow + totalTestDurationSeconds * 1000);
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

  selectOptionByIndex(index: number) {
    const question = this.currentQuestion();
    if (question && question.options && question.options[index]) {
      const optionId = question.options[index].id;
      if (optionId !== undefined) {
        this.quizState.saveAnswer(question.id!, optionId);
      }
    }
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

  isAnswered(qId: number): boolean {
    return !!this.quizState.getAnswer(qId);
  }

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
    if (!questions || questions.length === 0) return;

    const userAnswers = this.quizState.userAnswers();
    let correctCount = 0;

    const details = questions.map((q) => {
      const selectedOptionId = userAnswers.get(q.id);
      const correctOption = q.options.find((o) => o.isCorrect === true);
      const selectedOption = q.options.find((o) => o.id === selectedOptionId);
      const isRight = selectedOptionId === correctOption?.id;

      if (isRight) correctCount++;

      return {
        questionId: q.id,
        content: q.content,
        selectedOptionContent: selectedOption?.content || 'لم يتم الإجابة',
        correctOptionContent: correctOption?.content,
        isCorrect: isRight,
      };
    });

    const finalResult = {
      totalQuestions: questions.length,
      correctAnswers: correctCount,
      gradePercentage: (correctCount / questions.length) * 100,
      details: details,
    };

    this.quizState.saveTestResult(finalResult);
    this.quizState.stopTimer();
    this.localStorage.remove('current_session');
    this.router.navigate(['../../result'], { relativeTo: this.route });
  }
}
