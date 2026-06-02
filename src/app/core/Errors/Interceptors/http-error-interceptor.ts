import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthFacade } from '../../Auth/services/auth-facade';
import { NotificationService } from '../../../features/doctor/Services/notification';
import { RateLimitService, LockType } from '../../Services/rate-limit-service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);
    const authService = inject(AuthFacade);
    const notification = inject(NotificationService);
    const rateLimitService = inject(RateLimitService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            switch (error.status) {
                case 401:
                    authService.logout();
                    router.navigate(['/main/login'], {
                        queryParams: { returnUrl: router.url },
                    });
                    break;

                case 403:
                    router.navigate(['/access-denied']);
                    break;

                case 404:
                    notification.showWarning('المورد المطلوب غير موجود', 'تحذير');
                    break;

                case 429:
                    handleRateLimit(error, req.url, rateLimitService, notification);
                    break;

                case 500:
                case 502:
                case 503:
                    notification.showError('خطأ في الخادم - يرجى المحاولة لاحقاً', 'خطأ');
                    break;
            }

            return throwError(() => error);
        }),
    );
};

/**
 * معالجة خطأ 429 بشكل منفصل ونظيف
 */
function handleRateLimit(
    error: HttpErrorResponse,
    url: string,
    rateLimitService: RateLimitService,
    notification: NotificationService
): void {
    let body: any = null;

    if (error.error) {
        if (typeof error.error === 'string') {
            try {
                body = JSON.parse(error.error);
            } catch {
                body = null;
            }
        } else {
            body = error.error;
        }
    }

    const secondsFromBody =
        body?.retryAfterSeconds ??
        body?.RetryAfterSeconds ??
        body?.retryAfter ??
        body?.RetryAfter ??
        null;

    const retryAfterHeader = error.headers?.get('Retry-After');
    const secondsFromHeader = retryAfterHeader ? Number(retryAfterHeader) : null;

    const finalSeconds = secondsFromBody ?? secondsFromHeader ?? 60;

    const message =
        body?.message ??
        body?.Message ??
        body?.title ??
        'لقد تخطيت الحد المسموح، يرجى الانتظار.';

    const lockType = detectLockType(url);

    rateLimitService.startLock(finalSeconds, message, lockType);
    // notification.showWarning(message, 'تقييد الطلبات');
}

/**
 * تحديد نوع القفل من الـ URL
 */
function detectLockType(url: string): LockType {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.includes('/auth/login')) {
        return 'login';
    }
    if (lowerUrl.includes('/test/start')) {
        return 'test';
    }
    return 'global';
}