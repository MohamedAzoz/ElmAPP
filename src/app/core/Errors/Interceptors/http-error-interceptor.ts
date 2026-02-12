import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthFacade } from '../../Auth/services/auth-facade';
import { NotificationService } from '../../../features/doctor/Services/notification';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthFacade);
  const notification = inject(NotificationService);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle specific HTTP errors
      switch (error.status) {
        case 401:
          // Unauthorized - redirect to login
          authService.logout();
          router.navigate(['/login'], {
            queryParams: { returnUrl: router.url },
          });
          break;

        case 403:
          // Forbidden - redirect to access denied page
          router.navigate(['/access-denied']);
          break;

        case 404:
          // Not found
          notification.showWarning('المورد المطلوب غير موجود', 'تحذير');
          break;

        case 500:
        case 502:
        case 503:
          // Server errors
          notification.showError('خطأ في الخادم - يرجى المحاولة لاحقاً', 'خطأ');
          break;
      }

      // Re-throw the error for further handling
      return throwError(() => error);
    }),
  );
};
