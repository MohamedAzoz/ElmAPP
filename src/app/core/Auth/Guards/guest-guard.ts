import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { IdentitySignals } from '../services/identity-signals';

export const guestGuard: CanActivateFn = (route, state) => {
  const identity = inject(IdentitySignals);
  const router = inject(Router);

  if (!identity.isAuthenticated) {
    return true;
  }
  // التوجيه الصحيح
  return router.navigate(['/main/home']);
};