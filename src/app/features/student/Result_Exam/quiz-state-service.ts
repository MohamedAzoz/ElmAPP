import { Injectable, signal, effect, computed, inject } from '@angular/core';
import { LocalStorage } from '../../../core/Services/local-storage';

@Injectable({ providedIn: 'root' })
export class QuizStateService {
  private localStorage = inject(LocalStorage);
  userAnswers = signal<Map<number, number>>(new Map());
  userBankAnswers = signal<Map<number, number>>(new Map());
  timeLeft = signal<number>(0.1);
  timerString = signal<string>('00:00');
  isBankTest=signal<boolean>(false)
  private timerInterval: any;

  examResult = signal<any>(null);
  private readonly questionBankAnswersKey = 'question_bank_answers';
  private readonly KEYS = {
    ANSWERS: 'quiz_answers',
    RESULT: 'quiz_last_result',
    START_TIME: 'session_start_time',
    TIMER_EXPIRE: 'quiz_timer_expire',
  };

  constructor() {
    const savedAnswers = this.localStorage.get(this.KEYS.ANSWERS);
    if (savedAnswers) this.userAnswers.set(new Map(savedAnswers));
    const savedQuestionBankAnswers = this.localStorage.get(this.questionBankAnswersKey);
    if (savedQuestionBankAnswers) this.userBankAnswers.set(new Map(savedQuestionBankAnswers));

    const savedResult = this.localStorage.get(this.KEYS.RESULT);
    if (savedResult) {
      if (savedResult === '[object Object]') {
        this.localStorage.remove(this.KEYS.RESULT);
      } else {
        this.examResult.set(savedResult);
      }
    }

    effect(() => {
      if(this.isBankTest()){
        const questionBankAnswersObj = Array.from(this.userBankAnswers().entries());
        this.localStorage.set(this.questionBankAnswersKey, questionBankAnswersObj);
      }else{
        const answersObj = Array.from(this.userAnswers().entries());
        this.localStorage.set(this.KEYS.ANSWERS, answersObj);
      }

    });
  }

  saveTestResult(data: any,isBankQuiz:boolean=false) {
    let finalData;
    if (Array.isArray(data)) {
      const questions = data;
      let correct = 0;
      this.isBankTest.set(isBankQuiz)
      const answers = isBankQuiz ? this.userBankAnswers() : this.userAnswers();
      questions.forEach((q) => {
        const selectedOptionId = answers.get(q.id);
        const correctOption = q.options?.find((o: any) => o.isCorrect);
        if (selectedOptionId && correctOption && selectedOptionId === correctOption.id) {
          correct++;
        }
      });
      finalData = {
        score: questions.length > 0 ? (correct / questions.length) * 100 : 0,
        correct: correct,
        total: questions.length,
      };
    } else {
      finalData = {
        score: data.gradePercentage ?? data.score,
        correct: data.correctAnswers ?? data.correct,
        total: data.totalQuestions ?? data.total,
        details: data.details,
      };
    }

    this.examResult.set(finalData);
    this.localStorage.set(this.KEYS.RESULT, finalData);
    this.stopTimer();
    this.localStorage.remove(this.KEYS.START_TIME);
  }

  startTimer() {
    this.stopTimer();
    let startTime = this.localStorage.get(this.KEYS.START_TIME);
    if (!startTime) {
      startTime = Date.now();
      this.localStorage.set(this.KEYS.START_TIME, startTime);
    } else {
      startTime = Number(startTime);
    }

    const updateTimer = () => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const h = Math.floor(diff / 3600);
      const m = Math.floor((diff % 3600) / 60);
      const s = diff % 60;

      const hoursPart = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
      this.timerString.set(`${hoursPart}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
    };

    updateTimer();
    this.timerInterval = setInterval(updateTimer, 1000);
  }

  // التعديل هنا: نمرر مدة الاختبار بالثواني
  startCountdown(totalSeconds: number) {
    this.stopTimer();

    let expiryTime = this.localStorage.get(this.KEYS.TIMER_EXPIRE);

    if (!expiryTime) {
      expiryTime = Date.now() + totalSeconds * 1000;
      this.localStorage.set(this.KEYS.TIMER_EXPIRE, expiryTime);
    }

    const expiry = Number(expiryTime);

    this.timerInterval = setInterval(() => {
      const now = Date.now();
      const diff = Math.floor((expiry - now) / 1000);
      
      if (diff <= 0) {
        this.timeLeft.set(0);
        this.stopTimer();
        // لاحظ: لا نحذف quiz_timer_expire هنا، نتركه للـ Component ليتأكد من انتهاء الوقت
      } else {
        this.timeLeft.set(diff);
      }
    }, 1000);
  }

  timerTest = computed(() => {
    const totalSeconds = this.timeLeft();
    if (totalSeconds <= 0) return '00:00';

    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;

    const hoursPart = h > 0 ? `${h.toString().padStart(2, '0')}:` : '';
    return `${hoursPart}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  });

  saveBankAnswer(qId: number, oId: number) {
    this.userBankAnswers.update((m) => {
      const newMap = new Map(m);
      newMap.set(qId, oId);
      return newMap;
    });
    this.localStorage.set(this.questionBankAnswersKey, Array.from(this.userBankAnswers().entries()));
  }

  stopTimer() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  clearResult() {
    this.examResult.set(null);
    this.localStorage.remove(this.KEYS.RESULT);
  }

  clearBankQuiz() {
    this.stopTimer();
    this.userBankAnswers.set(new Map());
    this.timerString.set('00:00');
    this.localStorage.remove(this.KEYS.START_TIME);
    this.localStorage.remove(this.questionBankAnswersKey);
  }

  clearAll() {
    this.stopTimer();
    this.userAnswers.set(new Map());
    this.timerString.set('00:00');
    this.timeLeft.set(0);
    this.localStorage.remove(this.KEYS.ANSWERS);
    this.localStorage.remove(this.KEYS.TIMER_EXPIRE);
    this.localStorage.remove(this.KEYS.START_TIME);
    this.clearResult();
  }

  getAnswer(questionId: number) {
    return this.isBankTest() ? this.userBankAnswers().get(questionId) : this.userAnswers().get(questionId);
  }

  saveAnswer(qId: number, oId: number) {
    this.userAnswers.update((m) => {
      const newMap = new Map(m);
      newMap.set(qId, oId);
      return newMap;
    });
  }
}