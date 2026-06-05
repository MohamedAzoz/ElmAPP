import { inject, Injectable } from '@angular/core';
import { CatbeeIndexedDBService } from '@ng-catbee/indexed-db';
import { firstValueFrom, catchError, of } from 'rxjs';

export interface WrongAnswerEntry {
  id: string;
  sessionId: string;
  bankId: number;
  bankName?: string;
  questionId: number;
  questionContent: string;
  questionType?: string;
  selectedOptionId?: number;
  selectedOptionText?: string | null;
  correctOptionId?: number;
  correctOptionText?: string | null;
  attempts: number;
  lastAttemptAt: number;
}

export interface WrongAnswerBankSummary {
  bankId: number;
  bankName: string;
  wrongCount: number;
  lastAttemptAt: number;
}

@Injectable({
  providedIn: 'root',
})
export class WrongAnswersService {
  private readonly STORE_NAME = 'wrongAnswersStore';
  private readonly SESSION_KEY = 'wrong_answers_session_id';
  private sessionId = '';

  private readonly db = inject(CatbeeIndexedDBService);

  async ensureSession(): Promise<void> {
    if (this.sessionId) {
      return;
    }

    const stored = sessionStorage.getItem(this.SESSION_KEY);
    if (stored) {
      this.sessionId = stored;
      return;
    }

    this.sessionId = this.createSessionId();
    sessionStorage.setItem(this.SESSION_KEY, this.sessionId);
    await this.cleanupStaleSessions(this.sessionId);
  }

  async startNewSession(): Promise<void> {
    await this.clearCurrentSession();
    this.sessionId = this.createSessionId();
    sessionStorage.setItem(this.SESSION_KEY, this.sessionId);
  }

  async clearCurrentSession(): Promise<void> {
    const currentId = sessionStorage.getItem(this.SESSION_KEY);
    if (!currentId) {
      return;
    }

    const allEntries = await firstValueFrom(
      this.db.getAll<WrongAnswerEntry>(this.STORE_NAME).pipe(catchError(() => of([]))),
    );

    await Promise.all(
      allEntries
        .filter((entry) => entry.sessionId === currentId)
        .map((entry) =>
          firstValueFrom(
            this.db.deleteByKey(this.STORE_NAME, entry.id).pipe(catchError(() => of(null))),
          ),
        ),
    );

    sessionStorage.removeItem(this.SESSION_KEY);
    sessionStorage.removeItem('current_question_bank_id');
    sessionStorage.removeItem('current_question_bank_name');
    this.sessionId = '';
  }

  async saveWrongAnswer(options: {
    bankId: number;
    bankName?: string;
    questionId: number;
    questionContent: string;
    questionType?: string;
    selectedOptionId?: number;
    selectedOptionText?: string | null;
    correctOptionId?: number;
    correctOptionText?: string | null;
  }): Promise<void> {
    const sessionId = await this.ensureActiveSession();
    const recordId = this.buildRecordId(sessionId, options.bankId, options.questionId);

    const existing = await firstValueFrom(
      this.db.getByID<WrongAnswerEntry>(this.STORE_NAME, recordId).pipe(catchError(() => of(null))),
    );

    if (existing) {
      const updated: WrongAnswerEntry = {
        ...existing,
        bankName: options.bankName || existing.bankName || `Bank ${options.bankId}`,
        questionContent: options.questionContent || existing.questionContent,
        questionType: options.questionType || existing.questionType,
        selectedOptionId: options.selectedOptionId ?? existing.selectedOptionId,
        selectedOptionText: options.selectedOptionText ?? existing.selectedOptionText,
        correctOptionId: options.correctOptionId ?? existing.correctOptionId,
        correctOptionText: options.correctOptionText ?? existing.correctOptionText,
        attempts: existing.attempts + 1,
        lastAttemptAt: Date.now(),
      };

      await firstValueFrom(
        this.db.update(this.STORE_NAME, updated).pipe(catchError(() => of(null))),
      );
      return;
    }

    const entry: WrongAnswerEntry = {
      id: recordId,
      sessionId,
      bankId: options.bankId,
      bankName: options.bankName || `Bank ${options.bankId}`,
      questionId: options.questionId,
      questionContent: options.questionContent,
      questionType: options.questionType,
      selectedOptionId: options.selectedOptionId,
      selectedOptionText: options.selectedOptionText,
      correctOptionId: options.correctOptionId,
      correctOptionText: options.correctOptionText,
      attempts: 1,
      lastAttemptAt: Date.now(),
    };

    await firstValueFrom(this.db.add(this.STORE_NAME, entry).pipe(catchError(() => of(null))));
  }

  async getAllWrongAnswers(): Promise<WrongAnswerEntry[]> {
    const sessionId = await this.ensureActiveSession();
    const entries = await firstValueFrom(
      this.db.getAll<WrongAnswerEntry>(this.STORE_NAME).pipe(catchError(() => of([]))),
    );
    return entries.filter((entry) => entry.sessionId === sessionId);
  }

  async getBankSummaries(): Promise<WrongAnswerBankSummary[]> {
    const all = await this.getAllWrongAnswers();
    const groups = new Map<number, WrongAnswerBankSummary>();

    for (const item of all) {
      const existing = groups.get(item.bankId);
      const bankName = item.bankName || `Bank ${item.bankId}`;
      if (existing) {
        existing.wrongCount += 1;
        existing.lastAttemptAt = Math.max(existing.lastAttemptAt, item.lastAttemptAt);
      } else {
        groups.set(item.bankId, {
          bankId: item.bankId,
          bankName,
          wrongCount: 1,
          lastAttemptAt: item.lastAttemptAt,
        });
      }
    }

    return Array.from(groups.values()).sort((a, b) => b.lastAttemptAt - a.lastAttemptAt);
  }

  async getWrongAnswersByBank(bankId: number): Promise<WrongAnswerEntry[]> {
    const all = await this.getAllWrongAnswers();
    return all
      .filter((item) => item.bankId === bankId)
      .sort((a, b) => b.lastAttemptAt - a.lastAttemptAt);
  }

  async hasWrongAnswer(bankId: number, questionId: number): Promise<boolean> {
    const sessionId = await this.ensureActiveSession();
    const recordId = this.buildRecordId(sessionId, bankId, questionId);
    const existing = await firstValueFrom(
      this.db.getByID<WrongAnswerEntry>(this.STORE_NAME, recordId).pipe(catchError(() => of(null))),
    );
    return !!existing;
  }

  private buildRecordId(sessionId: string, bankId: number, questionId: number): string {
    return `${sessionId}:${bankId}:${questionId}`;
  }

  private async ensureActiveSession(): Promise<string> {
    if (!this.sessionId) {
      await this.ensureSession();
    }
    return this.sessionId;
  }

  private createSessionId(): string {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private async cleanupStaleSessions(currentSessionId: string): Promise<void> {
    const allEntries = await firstValueFrom(
      this.db.getAll<WrongAnswerEntry>(this.STORE_NAME).pipe(catchError(() => of([]))),
    );
    await Promise.all(
      allEntries
        .filter((entry) => entry.sessionId !== currentSessionId)
        .map((entry) =>
          firstValueFrom(
            this.db.deleteByKey(this.STORE_NAME, entry.id).pipe(catchError(() => of(null))),
          ),
        ),
    );
  }
}
