import { Component, inject, OnInit, computed, signal, effect, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { WrongAnswersBanks } from '../wrong-answers-banks/wrong-answers-banks';
import {
  WrongAnswersService,
  WrongAnswerBankSummary,
  WrongAnswerEntry,
} from '../wrong-answers.service';
import { AutoCleanupService } from '../../../../core/Services/auto-cleanup.service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  standalone: true,
  selector: 'app-wrong-answers',
  imports: [CommonModule, ButtonModule, CardModule, WrongAnswersBanks],
  templateUrl: './wrong-answers.html',
  styleUrl: './wrong-answers.css',
})
export class WrongAnswers implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private wrongAnswersService = inject(WrongAnswersService);
  private autoCleanupService = inject(AutoCleanupService);

  private params = toSignal(this.route.paramMap);
  private routeBankId = computed(() => Number(this.params()?.get('bankId')));

  selectedBankId = signal<number | null>(null);
  bankSummaries = signal<WrongAnswerBankSummary[]>([]);
  bankQuestions = signal<WrongAnswerEntry[]>([]);
  loading = signal<boolean>(false);

  constructor() {
    effect(() => {
      const bankId = this.routeBankId();
      this.selectedBankId.set(bankId || null);
      if (bankId) {
        void this.loadBankQuestions(bankId);
      } else {
        this.bankQuestions.set([]);
      }
    });
  }

  async ngOnInit() {
    this.loading.set(true);
    // Initialize auto-cleanup for stale entries (older than 1 day)
    this.autoCleanupService.initializeAutoCleanup();
    await this.wrongAnswersService.ensureSession();
    await this.refreshSummaries();
    this.loading.set(false);
  }

  ngOnDestroy() {
    this.autoCleanupService.stopAutoCleanup();
  }

  async refreshSummaries() {
    this.loading.set(true);
    this.bankSummaries.set(await this.wrongAnswersService.getBankSummaries());
    this.loading.set(false);
  }

  async loadBankQuestions(bankId: number) {
    this.loading.set(true);
    this.bankQuestions.set(await this.wrongAnswersService.getWrongAnswersByBank(bankId));
    this.loading.set(false);
  }

  selectBank(bankId: number) {
    this.router.navigate([bankId], { relativeTo: this.route });
  }

  async clearSession() {
    await this.wrongAnswersService.clearCurrentSession();
    this.bankSummaries.set([]);
    this.bankQuestions.set([]);
    this.selectedBankId.set(null);
    this.router.navigate(['../wrong-answers'], { relativeTo: this.route });
  }

  formatTime(timestamp: number) {
    return new Date(timestamp).toLocaleString('ar-EG', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}
