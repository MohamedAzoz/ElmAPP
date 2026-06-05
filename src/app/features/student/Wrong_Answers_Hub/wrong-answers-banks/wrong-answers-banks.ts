import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

export interface WrongAnswerBankSummary {
  bankId: number;
  bankName: string;
  wrongCount: number;
  lastAttemptAt: number;
}

@Component({
  standalone: true,
  selector: 'app-wrong-answers-banks',
  imports: [CommonModule, ButtonModule],
  templateUrl: './wrong-answers-banks.html',
  styleUrl: './wrong-answers-banks.css',
})
export class WrongAnswersBanks {
  @Input() banks: WrongAnswerBankSummary[] = [];
  @Input() selectedBankId: number | null = null;
  @Output() bankSelect = new EventEmitter<number>();

  formatCount(count: number) {
    return count;
  }
}
