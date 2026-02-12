// auth.guard.ts
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!token || !user) {
    window.alert('You must be logged in to access this page');
    window.location.href = '/login';
    return false;
  }

  const role = user.role;

  // Define allowed pages per role
  const roleAccess: Record<number, string[]> = {
    1: ['/admin', '/admin-users', '/process-request'],
    2: ['/home-staff', '/process-request'],
    3: ['/my-requests', '/request-detail', '/downloads']
  };

  const currentUrl = state.url;

  const allowed = roleAccess[role]?.some((path: string) => currentUrl.startsWith(path));

  if (!allowed) {
    window.alert('You do not have access to this page');
    window.location.href = '/';
    return false;
  }

  return true;
};
