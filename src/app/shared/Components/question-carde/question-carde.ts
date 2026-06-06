import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OptionsDto2, QuestionsDto2 } from '../../../core/api/clients';

@Component({
  selector: 'app-question-carde',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-carde.html',
  styleUrls: ['./question-carde.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionCarde implements OnChanges {
  @Input() index?: number;
  @Input({ required: true }) question!: QuestionsDto2;
  @Input() savedAnswerId?: number;
  @Input() isTestMode = false;
  @Output() answerSelect = new EventEmitter<number>();

  private sanitizer = inject(DomSanitizer);
  safeImageUrl: SafeResourceUrl | null = null;
  selectedOptionId: number | null = null;
  optionLabels = ['A', 'B', 'C', 'D'];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savedAnswerId']) {
      this.selectedOptionId = this.savedAnswerId ?? null;
    }

    if (changes['question']) {
      this.safeImageUrl = this.createSafeUrl(this.question.imageUrl);
      if (!this.savedAnswerId) {
        this.selectedOptionId = null;
      }
    }
  }

  private createSafeUrl(url?: string | null): SafeResourceUrl | null {
    if (!url) {
      return null;
    }

    const trimmed = url.trim();
    let fileId = '';

    // 1. إذا كان المدخل رابطاً كاملاً من جوجل درايف
    if (trimmed.includes('drive.google.com')) {
      if (trimmed.includes('id=')) {
        fileId = trimmed.split('id=')[1].split('&')[0];
      } else if (trimmed.includes('d/')) {
        fileId = trimmed.split('d/')[1].split('/')[0];
      }
    } 
    // 2. إذا كان المدخل هو الـ File ID فقط القادم مباشرة من الباك إند
    else if (trimmed.length > 20 && !trimmed.startsWith('http') && !trimmed.startsWith('data:') && !trimmed.startsWith('blob:')) {
      fileId = trimmed;
    }

    // إذا تم العثور على مـعرف الملف (جوجل درايف)، نربطه برابط العرض المباشر والـ Direct Rendering الخفيف والممتاز للـ <img>
    if (fileId) {
      const directImageUrl = `https://lh3.googleusercontent.com/d/${fileId}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(directImageUrl);
    }

    // 3. في حال كان الرابط عادياً ومباشراً من أي سيرفر آخر أو Base64
    const isAllowed =
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('data:image/') ||
      trimmed.startsWith('blob:');

    return isAllowed ? this.sanitizer.bypassSecurityTrustResourceUrl(trimmed) : null;
  }

  select(option: OptionsDto2): void {
    if (!option?.id) {
      return;
    }

    this.selectedOptionId = option.id;
    this.answerSelect.emit(option.id);
  }

  trackByOption(_index: number, option: OptionsDto2): number | undefined {
    return option.id;
  }

  getOptionClass(option: OptionsDto2): string {
    if (this.selectedOptionId === null) {
      return 'option-card option-default';
    }

    const isSelected = option.id === this.selectedOptionId;

    if (this.isTestMode) {
      return isSelected ? 'option-card option-selected' : 'option-card option-passive';
    }

    if (isSelected) {
      return option.isCorrect ? 'option-card option-correct' : 'option-card option-wrong';
    }

    if (option.isCorrect && this.selectedOptionId !== null) {
      return 'option-card option-correct-fade';
    }

    return 'option-card option-passive';
  }
}