import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TestFacade } from '../../test-facade';
import { FormsModule } from '@angular/forms';
import { SelectModule } from 'primeng/select';
import { InputNumberModule } from 'primeng/inputnumber';
import { CardModule } from 'primeng/card';
import { FloatLabelModule } from 'primeng/floatlabel';
import { QuestionBankFacade } from '../../../QuestionBanks/question-bank-facade';
import { toSignal } from '@angular/core/rxjs-interop';
import { StartTestCommand } from '../../../../../core/api/clients';
import { LocalStorage } from '../../../../../core/Services/local-storage';
import { RateLimitService } from '../../../../../core/Services/rate-limit-service';
import { LockUi } from '../../../../../shared/Components/lock-ui/lock-ui';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { WrongAnswersService } from '../../../Wrong_Answers_Hub/wrong-answers.service';
@Component({
  selector: 'app-start-test',
  standalone: true,
  imports: [
    FormsModule,
    SelectModule,
    InputNumberModule,
    CardModule,
    FloatLabelModule,
    LockUi,
    ButtonModule,
  ],
  templateUrl: './start-test.html',
  styleUrl: './start-test.css',
})
export class StartTest {
  private route = inject(ActivatedRoute);
  public rateLimitService = inject(RateLimitService);
  private router = inject(Router);
  private localStorage = inject(LocalStorage);
  private messageService = inject(MessageService);
  private wrongAnswersService = inject(WrongAnswersService);
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
        const count = Math.round(this.bankFacade.countQuestionsInBank() * 0.25);
        this.numQuestions.set(count);
      }
    });
  }

  async onStart() {
    if (!this.selectedBank()) return;

    const bankId = this.selectedBank().id;
    const bankName = this.selectedBank().name || `Bank ${bankId}`;

    sessionStorage.setItem('current_question_bank_id', bankId.toString());
    sessionStorage.setItem('current_question_bank_name', bankName);

    void this.wrongAnswersService.startNewSession();

    const command: StartTestCommand = {
      questionsBankId: bankId,
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
