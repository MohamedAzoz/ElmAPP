import { ChangeDetectionStrategy, Component, inject, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { QuestionsDto2 } from '../../../core/api/clients';

@Component({
  selector: 'app-question-esay-carde',
  imports: [CommonModule],
  templateUrl: './question-esay-carde.html',
  styleUrls: ['./question-esay-carde.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionEsayCarde implements OnChanges {
  @Input() index?: number;
  @Input({ required: true }) question!: QuestionsDto2;

  showAnswer = false;
  safeImageUrl: SafeResourceUrl | null = null;

  private sanitizer = inject(DomSanitizer);

  ngOnChanges(): void {
    this.safeImageUrl = this.createSafeUrl(this.question.imageUrl);
  }

  get answerText(): string {
    return this.question.modelAnswer?.trim() || 'لا توجد إجابة نموذجية متاحة لهذا السؤال.';
  }

  toggleAnswer(): void {
    this.showAnswer = !this.showAnswer;
  }

  private createSafeUrl(url?: string | null): SafeResourceUrl | null {
    if (!url) {
      return null;
    }
       
    const trimmed = url.trim();
    const isAllowed =
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('blob:');

    return isAllowed ? this.sanitizer.bypassSecurityTrustResourceUrl(trimmed) : null;
  }
}
