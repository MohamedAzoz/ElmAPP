import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { IdentitySignals } from '../services/identity-signals';
import { Router } from '@angular/router';

export const guestGuard: CanActivateFn = (route, state) => {
  const identity = inject(IdentitySignals);
  const router = inject(Router);

  const isAuth = identity.isAuthenticated;
  if (!isAuth) {
    localStorage.clear();
    return true;
  }
  router.createUrlTree(['/main/home']);
  return false;
};
