import { HttpErrorResponse, HttpInterceptorFn, HttpRequest } from '@angular/common/http';
import { inject } from '@angular/core';
import { throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthFacade } from '../services/auth-facade';
import { environment } from '../../../../environments/environment.development';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authFacade = inject(AuthFacade);

  const request = enrichRequest(req, authFacade);

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !isPublicOrLogoutRequest(request.url)) {
        // لا نستدعي logout() لأنه يعمل HTTP call ستفشل بـ 401 أيضاً
        // بدلاً منه نمسح البيانات محلياً مباشرة ونعيد التوجيه
        authFacade.forceLogout();
      }

      // إثراء كائن الخطأ بمصفوفة errors لتجنب مشاكل القراءة في الـ Facades
      const backendErrors = error.error?.errors;
      const backendMessage = error.error?.message;

      if (Array.isArray(backendErrors)) {
        (error as any).errors = backendErrors;
      } else if (backendMessage) {
        (error as any).errors = [{ errorMessage: backendMessage }];
      } else {
        (error as any).errors = [{ errorMessage: error.message || 'حدث خطأ غير متوقع' }];
      }

      return throwError(() => error);
    }),
  );
};

function enrichRequest(
  request: HttpRequest<unknown>,
  authFacade: AuthFacade,
): HttpRequest<unknown> {
  if (!isApiRequest(request.url)) return request;

  let updatedRequest = request.clone({ withCredentials: true });

  const token = authFacade.userDataStore()?.token;
  if (token) {
    updatedRequest = updatedRequest.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return updatedRequest;
}

function isApiRequest(url: string): boolean {
  return url.includes(environment.apiUrl);
}

function isPublicOrLogoutRequest(url: string): boolean {
  const excludedEndpoints = ['/Auth/login', '/Auth/logout'];
  return excludedEndpoints.some((endpoint) => url.includes(endpoint));
}
