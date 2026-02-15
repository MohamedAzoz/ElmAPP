import { ErrorHandler, Injectable, inject, NgZone } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../features/doctor/Services/notification';
import { ErrorLogger } from './Services/error-logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private notificationService = inject(NotificationService);
  private errorLogger = inject(ErrorLogger);
  private zone = inject(NgZone);

  handleError(error: Error | HttpErrorResponse): void {
    let message: string;

    if (error instanceof HttpErrorResponse) {
      message = this.getServerErrorMessage(error);
    } else {
      message = error.message || 'حدث خطأ غير متوقع';
    }

    // Run inside Angular zone
    this.zone.run(() => {
      this.notificationService.showError(message);
    });

    this.errorLogger.logError(message, error.message);
  }

  private getServerErrorMessage(error: HttpErrorResponse): string {
    if (!navigator.onLine) {
      return 'لا يوجد اتصال بالإنترنت';
    }

    const errorMessages: Record<number, string> = {
      0: 'لا يمكن الاتصال بالخادم',
      400: 'طلب غير صالح',
      401: 'غير مصرح - يرجى تسجيل الدخول',
      403: 'غير مسموح - ليس لديك صلاحية',
      404: 'المورد المطلوب غير موجود',
      429: 'لقد تخطيت الحد المسموح، يرجى الانتظار.',
      500: 'خطأ في الخادم',
      502: 'الخادم غير متاح مؤقتاً',
      503: 'الخدمة غير متاحة حالياً',
    };

    return error.error?.message || errorMessages[error.status] || `خطأ: ${error.status}`;
  }
}
