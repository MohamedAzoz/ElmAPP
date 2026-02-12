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
  ],
  templateUrl: './start-test.html',
  styleUrl: './start-test.scss',
})
export class StartTest implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private title = inject(GlobalService);
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

  // toMinutes(time: string): number {
  //   const [hours, minutes] = time.split(':').map(Number);
  //   return (hours * 60 + minutes) * 0.1;
  // }
  // في الملف start-test.ts
  onStart() {
    if (!this.selectedBank()) return;

    const command = {
      questionsBankId: this.selectedBank().id,
      numberOfQuestions: this.numQuestions(),
    };

    this.testFacade.startTest(command).subscribe({
      next: (res) => {
        this.testFacade.isStarting.set(false);
        // this.quiztestFacade.TimeEnd(this.toMinutes(res.data?.duration || '0'));
        this.testFacade.currentTestData.set(res.data || null);
        // التأكد من وجود أسئلة قبل الانتقال
        const firstQuestionId = res.data?.questions?.[0]?.id;
        if (firstQuestionId) {
          // نستخدم ['./', id] للانتقال نسبةً للمسار الحالي (الذي ينتهي بـ /T)
          // ليصبح المسار: /T/123
          this.router.navigate([firstQuestionId], { relativeTo: this.route });
        } else {
          console.error('البنك فارغ، لا توجد أسئلة لبدء الاختبار');
        }
      },
      error: (err) => {
        this.testFacade.isStarting.set(false);
        console.error('خطأ في بدء الجلسة', err);
      },
    });
  }
}
