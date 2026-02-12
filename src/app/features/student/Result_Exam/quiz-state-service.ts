import { Injectable, signal, effect, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class QuizStateService {
  // تخزين الإجابات: المفتاح هو ID السؤال، والقيمة هي ID الخيار المختار
  userAnswers = signal<Map<number, number>>(new Map());
  // المؤقت
  timerString = signal<string>('00:00');
  // timeEnd = signal<number>(0); // بالثواني
  timeLeft = signal<number>(0); // بالثواني
  startTime = signal<number>(Date.now());
  timerTest = computed(() => {
    const m = Math.floor(this.timeLeft() / 60)
      .toString()
      .padStart(2, '0');
    const s = (this.timeLeft() % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  });

  private timerInterval: any;
  private readonly KEYS = {
    START_TIME: 'quiz_start_time',
    ANSWERS: 'quiz_answers',
    SCORE: 'quiz_last_score',
  };

  constructor() {
    // استرجاع الإجابات القديمة إن وجدت
    const savedAnswers = localStorage.getItem(this.KEYS.ANSWERS);
    if (savedAnswers) {
      this.userAnswers.set(new Map(JSON.parse(savedAnswers)));
    }

    // عند تغير الإجابات، احفظها في الـ LocalStorage
    effect(() => {
      const answersObj = Array.from(this.userAnswers().entries());
      localStorage.setItem(this.KEYS.ANSWERS, JSON.stringify(answersObj));
    });
  }

  startTimer() {
    let startTime = localStorage.getItem(this.KEYS.START_TIME);

    if (!startTime) {
      startTime = Date.now().toString();
      localStorage.setItem(this.KEYS.START_TIME, startTime);
    }

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((now - Number(startTime)) / 1000);

      const minutes = Math.floor(diff / 60)
        .toString()
        .padStart(2, '0');
      const seconds = (diff % 60).toString().padStart(2, '0');

      this.timerString.set(`${minutes}:${seconds}`);
    }, 800);
  }

  saveAnswer(questionId: number, optionId: number) {
    this.userAnswers.update((map) => {
      const newMap = new Map(map);
      newMap.set(questionId, optionId);
      return newMap;
    });
  }

  getAnswer(questionId: number): number | undefined {
    return this.userAnswers().get(questionId);
  }

  // حساب الدرجة
  calculateScore(questions: any[]): number {
    let correct = 0;
    const answers = this.userAnswers();

    questions.forEach((q) => {
      const selectedOptionId = answers.get(q.id);
      const correctOption = q.options?.find((o: any) => o.isCorrect);
      if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
        correct++;
      }
    });

    const finalScore = (correct / questions.length) * 100;
    localStorage.setItem(
      this.KEYS.SCORE,
      JSON.stringify({
        score: finalScore,
        correct: correct,
        total: questions.length,
      }),
    );
    return finalScore;
  }

  getSavedScore() {
    const score = localStorage.getItem(this.KEYS.SCORE);
    return score ? JSON.parse(score) : null;
  }

  resetQuiz() {
    localStorage.removeItem(this.KEYS.START_TIME);
    localStorage.removeItem(this.KEYS.ANSWERS);
    clearInterval(this.timerInterval);
    this.userAnswers.set(new Map());
    this.timerString.set('00:00');
  }

  clearAll() {
    this.resetQuiz();
    localStorage.removeItem(this.KEYS.SCORE);
    this.userAnswers.set(new Map());
    this.examResult = null;
    this.stopTimer();
  }
  private examResult: any = null;

  // دالة لحفظ نتيجة الاختبار القادمة من الـ API
  saveTestResult(data: any) {
    this.examResult = {
      score: data.scorePercentage, // ربط النسبة المئوية
      correct: data.correctAnswers, // ربط عدد الإجابات الصحيحة
      total: data.totalQuestions, // ربط إجمالي الأسئلة
    };
  }

  // الدالة التي تستخدمها صفحة Result لعرض البيانات
  getSavedScoreForTest() {
    return this.examResult;
  }

  // TimeEnd(time: number) {
  //   this.timeEnd.set(Math.round(time * 60));
  // }
  // هل مر 2 دقيقة؟ (120 ثانية)
  // canSubmit = computed(() => {
  //   const elapsed = Math.floor((Date.now() - this.startTime()) / 1000);
  //   return elapsed >= 60;
  // console.log(this.timeEnd());
  // return elapsed >= this.timeEnd();
  // });

  // canSubmit = computed(() => {
  //   const elapsed = Math.round((Date.now() - this.startTime()) / 1000);
  //   return elapsed >= 60;
  // });

  startCountdown(expiresAt: Date) {
    const expiry = new Date(expiresAt).getTime();

    // حفظ وقت البدء الفعلي في localStorage إذا لم يكن موجوداً لمنع تصفير الـ 2 دقيقة
    const storedStart = localStorage.getItem('session_start_time');
    if (storedStart) {
      this.startTime.set(Number(storedStart));
    } else {
      const now = Date.now();
      localStorage.setItem('session_start_time', now.toString());
      this.startTime.set(now);
    }

    if (this.timerInterval) clearInterval(this.timerInterval);

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((expiry - now) / 1000);

      if (diff <= 0) {
        this.timeLeft.set(0);
        clearInterval(this.timerInterval);
        // يمكنك هنا استدعاء دالة الإنهاء التلقائي
      } else {
        this.timeLeft.set(diff);
      }
    }, 1000);
  }

  stopTimer() {
    clearInterval(this.timerInterval);
    localStorage.removeItem('session_start_time');
  }
}
