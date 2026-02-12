import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { IdentitySignals } from '../services/identity-signals';

export const leaderGuard: CanActivateFn = (route, state) => {
  const identity = inject(IdentitySignals);
  const router = inject(Router);
  if (!identity.hasRole('Leader') || !identity.isAuthenticated) {
    router.navigate(['/main/login']);
    return false;
  }
  return true;
};
