import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private messageService = inject(MessageService);

  showSuccess(message: string, title: string = 'نجاح'): void {
    this.messageService.add({
      severity: 'success',
      summary: title,
      detail: message,
      life: 3000,
    });
  }

  showError(message: string, title: string = 'خطأ'): void {
    this.messageService.add({
      severity: 'error',
      summary: title,
      detail: message,
      life: 5000,
    });
  }

  showWarning(message: string, title: string = 'تحذير'): void {
    this.messageService.add({
      severity: 'warn',
      summary: title,
      detail: message,
      life: 4000,
    });
  }

  showInfo(message: string, title: string = 'معلومة'): void {
    this.messageService.add({
      severity: 'info',
      summary: title,
      detail: message,
      life: 3000,
    });
  }

  clear(): void {
    this.messageService.clear();
  }
}
