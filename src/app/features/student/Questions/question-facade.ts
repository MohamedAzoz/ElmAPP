import { firstValueFrom } from 'rxjs';
import { inject, Injectable, signal } from '@angular/core';
import { QuestionPublicClient, QuestionsDto2 } from '../../../core/api/clients';

@Injectable({
  providedIn: 'root',
})
export class QuestionFacade {
  questions = signal<QuestionsDto2[]>([]);
  isLoading = signal<boolean>(false);
  private questionPublicService = inject(QuestionPublicClient);

  async getQuestionsByBankId(bankId: number): Promise<QuestionsDto2[]> {
    this.isLoading.set(true);
    try {
      const response = await firstValueFrom(this.questionPublicService.byBank(bankId));
      const results = response.data || [];
      this.questions.set(results);
      return results;
    } catch (error) {
      console.error('[QuestionFacade] Failed to load questions for bank:', bankId, error);
      this.questions.set([]);
      return [];
    } finally {
      this.isLoading.set(false);
    }
  }
}
