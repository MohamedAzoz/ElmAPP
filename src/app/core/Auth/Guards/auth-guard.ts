import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { IdentitySignals } from '../services/identity-signals';

export const authGuard: CanActivateFn = (route, state) => {
  const identity = inject(IdentitySignals);
  const router = inject(Router);

  if (identity.isAuthenticated) {
    return true;
  }
  // التوجيه الصحيح بدون عمل nested URLs
  return router.navigate(['/main/login']);
};