// auth.guard.ts
import { CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const token = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const user = storedUser ? JSON.parse(storedUser) : null;

  if (!token || !user) {
    // Navigate to login page using Angular Router
    window.location.href = '/login'; // Can replace with Router.navigate in a service if needed
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
    // Navigate to home page for unauthorized access
    window.location.href = '/'; // Can replace with Router.navigate in a service if needed
    return false;
  }

  return true;
};
