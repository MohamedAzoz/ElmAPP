import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdentitySignals } from '../services/identity-signals';

export const roleGuard: CanActivateFn = (route) => {
  const identity = inject(IdentitySignals);
  const router = inject(Router);

  // الأدوار المسموح بيها للـ Route ده
  const allowedRoles: string[] = route.data?.['roles'] || [];

  // دور المستخدم الحالي
  const userRole = identity.roles[0].name;

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // ✅ مش مسموحله → وجهه لصفحة access-denied
  router.navigate(['/access-denied']);
  return false;
};
