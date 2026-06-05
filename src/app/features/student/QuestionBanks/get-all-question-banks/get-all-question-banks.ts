import { Component, computed, effect, inject, signal } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { QuestionFacade } from '../../Questions/question-facade';
import { QuestionBankFacade } from '../question-bank-facade';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { QuestionsBankDto2 } from '../../../../core/api/clients';
import { Carde } from '../../../../shared/Components/carde/carde';
import { QuestionBankCacheService } from '../../../../core/Services/question-bank-cache.service';
@Component({
  selector: 'app-get-all-question-banks',
  imports: [Skeleton, Carde],
  templateUrl: './get-all-question-banks.html',
  styleUrl: './get-all-question-banks.css',
})
export class GetAllQuestionBanks {
  private questionBankFacade = inject(QuestionBankFacade);
  private questionFacade = inject(QuestionFacade);
  private questionBankCacheService = inject(QuestionBankCacheService);
  private active = inject(ActivatedRoute);

  params = toSignal(this.active.paramMap);
  curriculumId = computed(() => Number(this.params()?.get('curriculumId')));
  // اختصارات للوصول للـ Signals بسهولة في الـ HTML
  questionBanks = computed(() => this.questionBankFacade.questionBanks());
  isLoadingColleges = computed(() => this.questionBankFacade.isQuestionBanktLoading());
  lastLoadedId = signal<number | null>(null);
  savedBankIds = signal<Set<number>>(new Set());
  savingBankId = signal<number | null>(null);

  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (!id || this.lastLoadedId() === id) return;

      this.lastLoadedId.set(id);
      this.questionBankFacade.getQuestionBanks(id);
    });

    void this.loadSavedBankIds();
  }

  private async loadSavedBankIds() {
    const banks = await this.questionBankCacheService.getAllBanks();
    const ids = new Set<number>(banks.map((bank) => Number(bank.bankId)));
    this.savedBankIds.set(ids);
  }

  async saveQuestionBank(questionBank: QuestionsBankDto2) {
    const bankId = questionBank?.id?.toString();
    if (!bankId) {
      console.warn('[GetAllQuestionBanks] Cannot save bank with missing id.');
      return;
    }

    this.savingBankId.set(Number(bankId));
    try {
      const questionList = await this.questionFacade.getQuestionsByBankId(Number(bankId));
      const bankToSave = {
        id: questionBank.id,
        name: questionBank.name || questionBank['subjectName'],
        questions: questionList,
      };

      await this.questionBankCacheService.saveBank(bankId, bankToSave);
      const updatedSet = new Set(this.savedBankIds());
      updatedSet.add(Number(bankId));
      this.savedBankIds.set(updatedSet);
      console.log(
        `[GetAllQuestionBanks] Bank ${bankId} cached locally with ${questionList.length} questions.`,
      );
    } catch (error) {
      console.error('[GetAllQuestionBanks] Failed to save question bank to cache:', error);
    } finally {
      this.savingBankId.set(null);
    }
  }
}
