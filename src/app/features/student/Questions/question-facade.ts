import { inject, Injectable, signal } from '@angular/core';
import { QuestionPublicClient, QuestionsDto2 } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class QuestionFacade {
  questions = signal<QuestionsDto2[]>([]);
  isLoading = signal<boolean>(false);
  private questionPublicService = inject(QuestionPublicClient);

  getQuestionsByBankId(bankId: number) {
    this.isLoading.set(true);
    this.questionPublicService.byBank(bankId).subscribe({
      next: (res) => this.questions.set(res.data || []),
      complete: () => this.isLoading.set(false),
    });
  }
}
