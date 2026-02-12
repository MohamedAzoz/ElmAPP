import { Injectable, signal } from '@angular/core';
import {
  QuestionsBankDto,
  QuestionsBankDto2,
  QuestionsBankPublicClient,
} from '../../../core/api/clients';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class QuestionBankFacade {
  questionBanks = signal<QuestionsBankDto2[]>([]);
  questionBank = signal<QuestionsBankDto | null>(null);
  countQuestionsInBank = signal<number>(0);
  isQuestionBanktLoading = signal<boolean>(false);
  constructor(
    private questionBankPublicService: QuestionsBankPublicClient,
    private http: HttpClient,
  ) {}

  getQuestionBanks(curriculumId: number) {
    return this.questionBankPublicService.questionsBanks(curriculumId).subscribe({
      next: (res) => {
        this.questionBanks.set(res.data || []);
        this.isQuestionBanktLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.questionBanks.set([]);
        this.isQuestionBanktLoading.set(false);
      },
    });
  }
  getQuestionBankById(id: number) {
    return this.questionBankPublicService.questionsBankById(id).subscribe({
      next: (res) => {
        this.questionBank.set(res.data || null);
        this.isQuestionBanktLoading.set(false);
      },
      error: (e) => {
        console.error(e);
        this.questionBank.set(null);
        this.isQuestionBanktLoading.set(false);
      },
    });
  }
  countQuestions(questionsBankId: number) {
    return this.http
      .get(`${environment.apiUrl}api/QuestionPublic/Count/ByBank/${questionsBankId}`)
      .subscribe({
        next: (res: any) => {
          this.countQuestionsInBank.set(res.data || 0);
          this.isQuestionBanktLoading.set(false);
        },
        error: (e) => {
          console.error(e);
          this.countQuestionsInBank.set(0);
          this.isQuestionBanktLoading.set(false);
        },
      });
  }
}
