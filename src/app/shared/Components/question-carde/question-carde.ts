import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
// نضيف الواجهات الجديدة لضمان التوافق (اختياري لكن مفضل)
import { QuestionsDto2 } from '../../../core/api/clients';

@Component({
  selector: 'app-question-carde',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './question-carde.html',
  styleUrl: './question-carde.scss',
})
export class QuestionCarde implements OnChanges {
  // نقبل النوعين (سؤال بنك أو سؤال اختبار)
  @Input({ required: true }) question!: QuestionsDto2;
  @Input() savedAnswerId: number | undefined;
  @Input() isTestMode: boolean = false;
  @Output() answerSelect = new EventEmitter<number>();

  selectedOptionId: number | null = null;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['savedAnswerId']) {
      this.selectedOptionId = this.savedAnswerId || null;
    }
    if (changes['question'] && !this.savedAnswerId) {
      this.selectedOptionId = null;
    }
  }

  select(option: any) {
    // في حالة الاختبار (Test Mode)، نسمح بتغيير الإجابة، لذا لا نوقف الدالة إذا كان مختاراً
    this.selectedOptionId = option.id!;
    this.answerSelect.emit(option.id!);
  }

  getOptionClass(option: any): string {
    // 1. الحالة الافتراضية: لم يتم اختيار شيء
    if (!this.selectedOptionId)
      return 'bg-white border-gray-200 text-gray-700 hover:border-indigo-400';

    const isSelected = option.id === this.selectedOptionId;

    // --- منطق الاختبار (Test Mode) ---
    // إذا لم تكن خاصية isCorrect موجودة، فهذا يعني أننا في وضع "اختبار" وليس "بنك أسئلة"
    // وبالتالي نريد تلوين الاختيار بالأزرق فقط دون إظهار صح/خطأ
    if (this.isTestMode) {
      if (isSelected) {
        return 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-sm'; // لون أزرق للاختيار
      }
      return 'bg-white border-gray-200 text-gray-700 opacity-100'; // باقي الخيارات تبقى عادية
    }

    // --- منطق بنك الأسئلة (Training Mode - القديم) ---
    // هنا isCorrect موجودة (true/false)
    if (isSelected && !this.isTestMode) {
      return option.isCorrect
        ? 'bg-green-100 border-green-500 text-green-800 font-bold'
        : 'bg-red-100 border-red-500 text-red-800';
    }

    if (option.isCorrect && this.selectedOptionId !== null && !this.isTestMode) {
      return 'bg-green-50 border-green-300 text-green-700';
    }

    return 'bg-gray-50 border-gray-200 text-gray-400 opacity-70';
  }


}
