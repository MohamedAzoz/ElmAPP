import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { Skeleton } from 'primeng/skeleton';
import { QuestionBankFacade } from '../question-bank-facade';
import { ActivatedRoute } from '@angular/router';
import { GlobalService } from '../../../../core/Services/global-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { Carde } from "../../../../shared/Components/carde/carde";
@Component({
  selector: 'app-get-all-question-banks',
  imports: [Skeleton, Carde],
  templateUrl: './get-all-question-banks.html',
  styleUrl: './get-all-question-banks.scss',
})
export class GetAllQuestionBanks implements OnInit {
  private questionBankFacade = inject(QuestionBankFacade);
  private title = inject(GlobalService);
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
  ngOnInit(): void {
    this.title.setTitle('بنوك الأسئلة');
  }
}
