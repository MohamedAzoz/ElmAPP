import { ErrorHandler, Injectable, inject, NgZone, Injector } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { NotificationService } from '../../features/doctor/Services/notification';
import { ErrorLogger } from './Services/error-logger';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private zone = inject(NgZone);
  private injector = inject(Injector); // استخدم Injector بدلاً من حقن الخدمات مباشرة

  handleError(error: any): void {
    // جلب الخدمات وقت الحاجة فقط لتجنب Circular Dependency
    const notificationService = this.injector.get(NotificationService);
    const errorLogger = this.injector.get(ErrorLogger);
    let message: string;
    // إذا كان الخطأ قادماً من HTTP، نقوم بتسجيله فقط لأن الـ Interceptor قام بعرض الإشعار بالفعل
    if (error instanceof HttpErrorResponse) {
      message = `HTTP Error: ${error.status} - ${error.message}`;
      errorLogger.logError('Network/Server Error', message);
      return; 
    } 

    // معالجة أخطاء الكود العادية
    message = error?.message || error?.toString() || 'حدث خطأ غير متوقع في التطبيق';

    this.zone.run(() => {
      notificationService.showError(message);
    });

    errorLogger.logError(message, error?.stack || 'No stack trace');
  }
  // private getServerErrorMessage(error: HttpErrorResponse): string {
  //   if (!navigator.onLine) {
  //     return 'لا يوجد اتصال بالإنترنت';
  //   }

  //   const errorMessages: Record<number, string> = {
  //     0: 'لا يمكن الاتصال بالخادم',
  //     400: 'طلب غير صالح',
  //     401: 'غير مصرح - يرجى تسجيل الدخول',
  //     403: 'غير مسموح - ليس لديك صلاحية',
  //     404: 'المورد المطلوب غير موجود',
  //     429: 'لقد تخطيت الحد المسموح، يرجى الانتظار.',
  //     500: 'خطأ في الخادم',
  //     502: 'الخادم غير متاح مؤقتاً',
  //     503: 'الخدمة غير متاحة حالياً',
  //   };

  //   return error.error?.message || errorMessages[error.status] || `خطأ: ${error.status}`;
  // }
}
