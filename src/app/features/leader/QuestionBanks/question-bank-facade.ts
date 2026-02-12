import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  QuestionsBankPublicClient,
  QuestionsBankLeaderClient,
  QuestionsBankDto2,
  QuestionsBankDto,
  AddQuestionsBankCommand,
  UpdateQuestionsBankCommand,
} from '../../../core/api/clients';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../../environments/environment.development';

@Injectable({
  providedIn: 'root',
})
export class QuestionBankFacade {
  private publicClient = inject(QuestionsBankPublicClient);
  private leaderClient = inject(QuestionsBankLeaderClient);
  private http = inject(HttpClient);

  // Signals لإدارة الحالة
  questionBanks = signal<QuestionsBankDto2[]>([]);
  questionBank = signal<QuestionsBankDto | null>(null);
  countQuestionsInBank = signal<number>(0);
  isLoading = signal<boolean>(false);

  // جلب الكل
  getQuestionBanks(curriculumId: number) {
    this.isLoading.set(true);
    this.publicClient.questionsBanks(curriculumId).subscribe({
      next: (res) => this.questionBanks.set(res.data || []),
      error: () => this.questionBanks.set([]),
      complete: () => this.isLoading.set(false),
    });
  }

  // العمليات الإدارية (نرسل Observable لكي نتمكن من عرض Toast في المكون)
  addQuestionBank(command: AddQuestionsBankCommand): Observable<any> {
    return this.leaderClient.createQuestion(command);
  }

  updateQuestionBank(command: UpdateQuestionsBankCommand): Observable<any> {
    return this.leaderClient.updateQuestion(command);
  }

  deleteQuestionBank(id: number): Observable<any> {
    return this.leaderClient.deleteQuestion(id);
  }

  countQuestions(questionsBankId: number) {
    return this.http.get(`${environment.apiUrl}api/QuestionPublic/Count/ByBank/${questionsBankId}`);
  }
}
