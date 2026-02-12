import { Injectable, signal } from '@angular/core';
import { AddQuestionsDto, QuestionPublicClient, QuestionsDto2 } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class QuestionFacade {
  questions = signal<QuestionsDto2[]>([]);
  isLoading = signal<boolean>(false);
  constructor(private questionPublicService: QuestionPublicClient) {}

  getQuestionsByBankId(bankId: number) {
    this.isLoading.set(true);
    this.questionPublicService.byBank(bankId).subscribe({
      next: (res) => this.questions.set(res.data || []),
      complete: () => this.isLoading.set(false),
    });
  }
}
