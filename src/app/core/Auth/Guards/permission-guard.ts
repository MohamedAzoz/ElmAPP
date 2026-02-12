import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { PermissionFacade } from '../services/permission-facade';

export const permissionGuard: CanActivateFn = (route, state) => {
  const per = inject(PermissionFacade);
  const router = inject(Router);
  
  // الحصول على اسم الصلاحية من بيانات الرابط
  const requiredPermission = route.data['permission'];

  // 1. إذا كان الرابط لا يتطلب صلاحية أصلاً، اسمح بالمرور
  if (!requiredPermission) {
    return true;
  }

  // 2. فحص هل المستخدم يملك هذه الصلاحية
  const hasPermission = per.hasPermission(requiredPermission);

  if (hasPermission) {
    return true; // مسموح له بالدخول
  } else {
    // 3. غير مسموح له، حوله لصفحة الخطأ
    // ملاحظة: تأكد أن المسار '/access-denied' موجود فعلياً في الـ Routes الرئيسية
    return router.createUrlTree(['/access-denied']); 
  }
};