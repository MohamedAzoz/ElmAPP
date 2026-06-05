import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  QuestionBankCacheService,
  QuestionBankCacheEntry,
} from '../../../../core/Services/question-bank-cache.service';
import { ButtonModule } from 'primeng/button';

type SavedBankData = {
  id: number;
  name?: string;
  subjectName?: string;
  questions?: Array<{ id?: number }>;
};

@Component({
  selector: 'app-offline-saved-question-banks',
  imports: [CommonModule, RouterModule, ButtonModule],
  templateUrl: './offline-saved-question-banks.html',
  styleUrl: './offline-saved-question-banks.css',
})
export class OfflineSavedQuestionBanks {
  private questionBankCacheService = inject(QuestionBankCacheService);

  isOnline = signal(window.navigator.onLine);
  isLoading = signal(true);
  savedBanks = signal<QuestionBankCacheEntry<SavedBankData>[]>([]);

  constructor() {
    window.addEventListener('online', () => this.isOnline.set(true));
    window.addEventListener('offline', () => this.isOnline.set(false));
    void this.loadSavedBanks();
  }

  async loadSavedBanks() {
    this.isLoading.set(true);
    const banks = await this.questionBankCacheService.getAllBanks<SavedBankData>();
    this.savedBanks.set(banks);
    this.isLoading.set(false);
  }

  trackByBankId(_index: number, bank: QuestionBankCacheEntry<SavedBankData>) {
    return bank.bankId;
  }

  getFirstQuestionId(bank: QuestionBankCacheEntry<SavedBankData>): number {
    return Number(bank.data?.questions?.[0]?.id ?? 0);
  }
}
