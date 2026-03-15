import { Component, HostListener, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, RouterModule, Router, NavigationEnd } from '@angular/router';
import { NgIf, NgClass, CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient } from '@angular/common/http';

export const appConfig = {
  providers: [
    provideHttpClient()
  ]
};

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterModule,
    NgIf,
    NgClass,
    FormsModule,
    ReactiveFormsModule
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Angeles City DRT';
  showSidebar = false;
  isLoggedIn = false;
  isAdmin = false;
  isStaff = false;
  isMobileSidebarOpen = false;

  // 🔹 Modal state
  showProfileIncompleteModal = false;

  constructor(private router: Router) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {

        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        this.isLoggedIn = !!token;
        this.isAdmin = user.role === 1;
        this.isStaff = user.role === 2;

        this.showSidebar = this.isLoggedIn;
        this.isMobileSidebarOpen = false;

        if (event.urlAfterRedirects === '/' && this.isLoggedIn) {
          if (this.isAdmin) this.router.navigate(['/admin']);
          else if (this.isStaff) this.router.navigate(['/home-staff']);
        }

        const publicRoutes = ['/', '/login', '/register', '/otpverify', '/reset-password'];
        if (!this.isLoggedIn && !publicRoutes.includes(event.urlAfterRedirects)) {
          this.router.navigate(['/']);
        }
      });
  }

  ngOnInit(): void {
    // 🔹 Listen for profile-incomplete event fired by profileGuard
    window.addEventListener('profile-incomplete', this.onProfileIncomplete);
  }

  ngOnDestroy(): void {
    window.removeEventListener('profile-incomplete', this.onProfileIncomplete);
  }

  // 🔹 Arrow function so `this` is preserved
  onProfileIncomplete = (): void => {
    this.showProfileIncompleteModal = true;
  }

  goToAccount(): void {
    this.showProfileIncompleteModal = false;
    this.router.navigate(['/account']);
  }

  closeProfileModal(): void {
    this.showProfileIncompleteModal = false;
  }

  toggleMobileSidebar(): void {
    this.isMobileSidebarOpen = !this.isMobileSidebarOpen;
  }

  closeMobileSidebar(): void {
    this.isMobileSidebarOpen = false;
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.isLoggedIn = false;
    this.showSidebar = false;
    this.isMobileSidebarOpen = false;
    window.dispatchEvent(new Event('auth-changed'));
    this.router.navigate(['/']);
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    this.updateBackgroundPosition('.nav-bg', event);
    this.updateBackgroundPosition('.login-bg', event);
  }

  private updateBackgroundPosition(selector: string, event: MouseEvent): void {
    const element = document.querySelector(selector) as HTMLElement | null;
    if (!element) return;

    const x = (event.clientX / window.innerWidth - 0.5) * 20;
    const y = (event.clientY / window.innerHeight - 0.5) * 20;
    element.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
  }
}
