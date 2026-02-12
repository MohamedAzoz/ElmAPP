import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpInterceptorFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, switchMap, take, finalize } from 'rxjs/operators';
import { AuthFacade } from '../services/auth-facade';
import { IdentitySignals } from '../services/identity-signals';
import { ResultOfAuthModelDto } from '../../api/clients';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authFacade = inject(AuthFacade);
    const identity = inject(IdentitySignals);
    const token = identity.token;

    // 1. استثناء طلبات تجديد التوكن لعدم الدخول في حلقة مفرغة
    if (req.url.includes('RefreshToken')) {
        return next(req.clone({ withCredentials: true }));
    }

    // 2. إعداد الطلب الأساسي مع التوكن
    let authReq = req;
    if (token) {
        // نستخدم دالة addTokenHeader لضمان توحيد المنطق
        authReq = addTokenHeader(req, token);
    }

    // 3. تنفيذ الطلب مع معالجة خطأ 401 (انتهى وقت التوكن)
    return next(authReq).pipe(
        catchError((error) => {
            if (error instanceof HttpErrorResponse && error.status === 401) {
                return handle401Error(authReq, next, authFacade);
            }
            return throwError(() => error);
        })
    );
};

/**
 * دالة إضافة التوكن للرأس (Header)
 * تم تعديلها لتكون آمنة مع رفع الملفات
 */
const addTokenHeader = (request: HttpRequest<any>, token: string) => {
    // التحقق: هل الطلب يحتوي على ملفات (FormData)؟
    const isFormData = request.body instanceof FormData;

    if (isFormData) {
        // في حالة الملفات: نكتفي بإضافة Authorization فقط 
        // ونحذر تماماً من إضافة Content-Type يدوياً
        return request.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            },
            withCredentials: true
        });
    }

    // في حالة الطلبات العادية (JSON)
    return request.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
            'Accept': 'application/json' 
        },
        withCredentials: true
    });
};

/**
 * معالجة خطأ 401 وتجديد التوكن
 */
const handle401Error = (
    request: HttpRequest<any>,
    next: HttpHandlerFn,
    authFacade: AuthFacade
): Observable<HttpEvent<any>> => {
    if (!isRefreshing) {
        isRefreshing = true;
        refreshTokenSubject.next(null);

        return authFacade.refresh().pipe(
            switchMap((res: ResultOfAuthModelDto) => {
                const newToken = res.data?.token;

                if (newToken) {
                    refreshTokenSubject.next(newToken);
                    return next(addTokenHeader(request, newToken));
                }

                authFacade.logout();
                return throwError(() => new Error('Session Expired'));
            }),
            catchError((err) => {
                authFacade.logout();
                return throwError(() => err);
            }),
            finalize(() => {
                isRefreshing = false;
            })
        );
    } else {
        // في حال كان هناك طلب تجديد قيد التنفيذ، انتظر حتى ينتهي ثم استخدم التوكن الجديد
        return refreshTokenSubject.pipe(
            filter((token) => token !== null),
            take(1),
            switchMap((token) => next(addTokenHeader(request, token!)))
        );
    }
};