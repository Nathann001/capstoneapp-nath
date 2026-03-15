import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const profileGuard: CanActivateFn = (route) => {
  const router = inject(Router);

  const token = localStorage.getItem('token');
  if (!token) {
    router.navigate(['/']);
    return false;
  }

  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const user = JSON.parse(storedUser);

    if (user.role === 1) return true;

    if (user.role === 2) return true;

    if (!user.detailsCompleted) {
      window.dispatchEvent(new Event('profile-incomplete'));
      return false;
    }
  }

  return true;
};
