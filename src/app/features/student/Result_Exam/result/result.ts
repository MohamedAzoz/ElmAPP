import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PrimengBtnModule } from '../../../../shared/Models/primeng-btn/primeng-btn-module';
import { QuizStateService } from '../quiz-state-service';
import { GlobalService } from '../../../../core/Services/global-service';
import { DecimalPipe } from '@angular/common';
@Component({
  selector: 'app-result',
  imports: [PrimengBtnModule , DecimalPipe],
  templateUrl: './result.html',
})
export class Result implements OnInit {
  private quizState = inject(QuizStateService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private title = inject(GlobalService);
  scoreData: any = { score: 0, correct: 0, total: 0 };

  ngOnInit() {
    this.title.setTitle('نتيجة الاختبار');
    this.scoreData = this.quizState.getSavedScore()??this.quizState.getSavedScoreForTest();
    if (!this.scoreData) {
      this.quizState.clearAll();
      // عدل المسار حسب رغبتك، مثلاً العودة لقائمة المناهج
      this.router.navigate(['../../'], { relativeTo: this.route });
    }
  }

  goBack() {
    this.quizState.clearAll(); // تنظيف البيانات والدرجة عند العودة
    // العودة لمستوى الـ QB (عدل المسار حسب راوت الـ App عندك)
    this.router.navigate(['../'], { relativeTo: this.route });
  }

  goHome() {
    this.quizState.clearAll();
    this.router.navigate(['../../'], { relativeTo: this.route });
  }
}
