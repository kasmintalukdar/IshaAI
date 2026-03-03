import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { map, take } from 'rxjs';

export const proGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);

  return auth.isPro$.pipe(
    take(1),
    map(isPro => {
      if (isPro) return true;
      
      // If not Pro, kick them out or show upgrade modal
      alert('This area is for Pro members only!');
      router.navigate(['/dashboard']); 
      return false;
    })
  );
};