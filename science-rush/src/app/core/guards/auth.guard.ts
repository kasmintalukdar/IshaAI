import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const guestGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // 🟢 CORRECT LOGIC:
  // If user is authenticated, let them in.
  if (auth.isAuthenticated()) {
    return true;
  }

  // 🔴 If not authenticated, send them to login.
  router.navigate(['/auth/login']);
  return false;
};