import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { AuthFacade } from '../services/auth-facade';
import { IdentitySignals } from '../services/identity-signals';
import { ResultOfAuthModelDto } from '../../api/clients';
import { TokenRefreshState } from '../services/token-refresh-state';

// let isRefreshing = false;
// const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);
  const identity = inject(IdentitySignals);
  const token = identity.token;
  const refreshState = inject(TokenRefreshState);
  if (req.url.includes('RefreshToken')) {
    return next(req.clone({ withCredentials: true }));
  }

  let authReq = req;
  if (token) {
    authReq = addTokenHeader(req, token);
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        return handle401Error(authReq, next, authFacade, refreshState);
      }
      return throwError(() => error);
    }),
  );
};
/**
 * دالة إضافة التوكن للرأس (Header)
 * تم تعديلها لتكون آمنة مع رفع الملفات
 */
const addTokenHeader = (request: HttpRequest<any>, token: string): HttpRequest<any> => {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true,
  });
};

/**
 * معالجة خطأ 401 وتجديد التوكن
 * ✅ مع حماية من الحلقات المفرغة
 * ✅ مع دعم الطلبات المتزامنة
 */
const handle401Error = (
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  authFacade: AuthFacade,
  refreshState: TokenRefreshState,
): Observable<HttpEvent<any>> => {
  if (!refreshState.isRefreshing) {
    refreshState.isRefreshing = true;
    refreshState.refreshTokenSubject.next(null);

    return authFacade.refresh().pipe(
      switchMap((res: ResultOfAuthModelDto) => {
        const newToken = res.data?.token;

        if (newToken) {
          refreshState.refreshTokenSubject.next(newToken);
          return next(addTokenHeader(request, newToken));
        }

        // ✅ فشل التجديد → تسجيل خروج
        authFacade.logout();
        return throwError(() => new Error('Session Expired'));
      }),
      catchError((err) => {
        // ✅ أي خطأ → تسجيل خروج ونظف الحالة
        refreshState.reset();
        authFacade.logout();
        return throwError(() => err);
      }),
      finalize(() => {
        refreshState.isRefreshing = false;
      }),
    );
  }

  // ✅ طلبات تانية بتستنى التوكن الجديد
  return refreshState.refreshTokenSubject.pipe(
    filter((token): token is string => token !== null),
    take(1),
    switchMap((token) => next(addTokenHeader(request, token))),
  );
};
 