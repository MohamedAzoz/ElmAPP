import { Component, computed, effect, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TestFacade } from '../../test-facade';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { PrimengBtnModule } from '../../../../../shared/Models/primeng-btn/primeng-btn-module';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { QuestionBankFacade } from '../../../QuestionBanks/question-bank-facade';
import { GlobalService } from '../../../../../core/Services/global-service';
import { toSignal } from '@angular/core/rxjs-interop';
import { StartTestCommand } from '../../../../../core/api/clients';
import { LocalStorage } from '../../../../../core/Services/local-storage';
import { RateLimitService } from '../../../../../core/Services/rate-limit-service';
import { LockUi } from '../../../../../shared/Components/lock-ui/lock-ui';
import { MessageService } from 'primeng/api';
@Component({
  selector: 'app-start-test',
  standalone: true,
  imports: [
    FormsModule,
    SelectModule,
    InputNumberModule,
    PrimengBtnModule,
    CardModule,
    FloatLabelModule,
    LockUi,
  ],
  templateUrl: './start-test.html',
  styleUrl: './start-test.scss',
})
export class StartTest implements OnInit {
  private route = inject(ActivatedRoute);
  public rateLimitService = inject(RateLimitService);
  private router = inject(Router);
  private title = inject(GlobalService);
  private localStorage = inject(LocalStorage);
  private messageService = inject(MessageService);
  bankFacade = inject(QuestionBankFacade);
  testFacade = inject(TestFacade);
  selectedBank = signal<any>(null);
  numQuestions = signal<number>(5);

  private params = toSignal(this.route.paramMap);
  private curriculumId = computed(() => Number(this.params()?.get('curriculumId')));

  constructor() {
    effect(() => {
      const id = this.curriculumId();
      if (id) {
        this.bankFacade.getQuestionBanks(id);
      }
    });

    effect(() => {
      const col = this.selectedBank();

      if (col?.id) {
        this.bankFacade.countQuestions(col.id);
        const count = Math.round(this.bankFacade.countQuestionsInBank() / 3);
        this.numQuestions.set(count);
      }
    });
  }

  ngOnInit() {
    this.title.setTitle('بدء الاختبار');
  }
  onStart() {
    if (!this.selectedBank()) return;

    const command: StartTestCommand = {
      questionsBankId: this.selectedBank().id,
      numberOfQuestions: this.numQuestions(),
    };

    this.testFacade.isStarting.set(true);

    this.testFacade.startTest(command).subscribe({
      next: (res) => {
        this.testFacade.isStarting.set(false);
        const questions = res.data || [];

        this.testFacade.currentTestData.set(questions);

        if (questions.length > 0) {
          this.localStorage.set('current_session', questions);
          const firstQuestionId = questions[0].id;
          this.router.navigate([firstQuestionId], { relativeTo: this.route });
        } else {
          this.messageService.add({ severity: 'error', summary: 'خطأ', detail: 'البنك فارغ' });
        }
      },
      error: (err) => {
        this.testFacade.isStarting.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'خطأ',
          detail: 'خطأ في بدء الاختبار',
        });
      },
    });
  }
}
