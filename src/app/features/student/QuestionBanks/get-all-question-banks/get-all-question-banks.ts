import { Component, computed, effect, inject, signal } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { QuestionBankFacade } from '../question-bank-facade';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Carde } from '../../../../shared/Components/carde/carde';
@Component({
  selector: 'app-get-all-question-banks',
  imports: [Skeleton, Carde],
  templateUrl: './get-all-question-banks.html',
  styleUrl: './get-all-question-banks.css',
})
export class GetAllQuestionBanks {
  private questionBankFacade = inject(QuestionBankFacade);
  private active = inject(ActivatedRoute);

  params = toSignal(this.active.paramMap);
  curriculumId = computed(() => Number(this.params()?.get('curriculumId')));
  // اختصارات للوصول للـ Signals بسهولة في الـ HTML
  questionBanks = computed(() => this.questionBankFacade.questionBanks());
  isLoadingColleges = computed(() => this.questionBankFacade.isQuestionBanktLoading());
  lastLoadedId = signal<number | null>(null);
  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (!id || this.lastLoadedId() === id) return;

      this.lastLoadedId.set(id);
      this.questionBankFacade.getQuestionBanks(id);
    });
  }
}
