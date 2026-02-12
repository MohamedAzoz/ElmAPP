import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { IdentitySignals } from '../services/identity-signals';

export const adminGuard: CanActivateFn = (route, state) => {
  const identity = inject(IdentitySignals);
  const router = inject(Router);
  if (identity.hasRole('Admin') && identity.isAuthenticated) {
    return true;
  }
  router.navigate(['/main/login']);
  return false;
};
