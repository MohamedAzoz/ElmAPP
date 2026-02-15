import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimengBtnModule } from '../../../../shared/Models/primeng-btn/primeng-btn-module';
import { QuizStateService } from '../quiz-state-service';
import { GlobalService } from '../../../../core/Services/global-service';
import { DecimalPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-result',
  imports: [PrimengBtnModule, DecimalPipe, CommonModule],
  templateUrl: './result.html',
})
export class Result implements OnInit {
  public quizState = inject(QuizStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private title = inject(GlobalService);

  // استخدام computed لقراءة النتيجة مباشرة من السيرفس لضمان التحديث عند الرفريش
  scoreData = computed(() => this.quizState.examResult());
  showReview = signal<boolean>(false);

  ngOnInit() {
    this.title.setTitle('نتيجة الاختبار');

    // التحقق من وجود نتيجة، إذا لم توجد نعود للرئيسية
    if (!this.scoreData()) {
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }

  toggleReview() {
    this.showReview.update((v) => !v);
  }

  goBack() {
    this.quizState.clearAll();
    // العودة لمسار الموارد
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  goHome() {
    this.quizState.clearAll();
    this.router.navigate(['/'], { relativeTo: this.route });
  }
}
