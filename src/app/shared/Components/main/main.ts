import { Component, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Footer } from '../../../layout/footer/footer';
import { Nav } from '../../../layout/nav/nav';
import { LockUi } from '../lock-ui/lock-ui';
import { RateLimitService } from '../../../core/Services/rate-limit-service';
import { DirectionService } from '../../../core/Services/direction';
import { QuizStateService } from '../../../features/student/Result_Exam/quiz-state-service';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-main',
  imports: [Nav, RouterOutlet, Footer, LockUi],
  templateUrl: './main.html',
  styleUrl: './main.css',
})
export class Main {
  rateLimitService = inject(RateLimitService);
  dir = inject(DirectionService);
  private router = inject(Router);
  private quizState = inject(QuizStateService);

  // constructor() {
  //   this.router.events
  //     .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
  //     .subscribe((event: NavigationEnd) => {
  //       if (!event.urlAfterRedirects.includes('/result')) {
  //         this.quizState.clearResult();
  //       }
  //     });
  // }

  shouldShowHeaderFooter(): boolean {
    const url = this.router.url;
    // Hide header/footer if in GetAllQuestions, TestSession, or Result
    const isQuestionBank = url.includes('/QB/') && /\/QB\/[^/]+\/[^/]+/.test(url);
    const isTestSession = url.includes('/T/') && /\/T\/[^/]+/.test(url);
    const isResult = url.includes('/result');

    return !(isQuestionBank || isTestSession || isResult);
  }
}
