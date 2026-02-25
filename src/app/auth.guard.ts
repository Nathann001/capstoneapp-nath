import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  const currentUrl = state.url;
  console.log('Guard running:', { token, user, currentUrl });
  // --- GUEST ACCESS ---
  // Always allow landing/login/register for guests
  if (!token || !user) {
    if (['/', '/login', '/register'].includes(currentUrl)) return true;

    // Block access to protected pages
    return router.createUrlTree(['/']);
  }

  // --- LOGGED-IN USERS ---
  // Prevent logged-in users from visiting login/register
  if (['/login', '/register'].includes(currentUrl)) return router.createUrlTree(['/']);

  // --- ROLE-BASED ACCESS ---
  const roleAccess: Record<number, string[]> = {
    1: ['/admin', '/admin-users', '/process-request'],
    2: ['/home-staff', '/process-request'],
    3: ['/my-requests', '/request-detail', '/downloads']
  };

  const allowed = roleAccess[user.role]?.some(path => currentUrl.startsWith(path));

  // Allow access if role permits or it's the landing page
  if (allowed || currentUrl === '/') return true;

  // Otherwise redirect to landing page
  return router.createUrlTree(['/']);

};
