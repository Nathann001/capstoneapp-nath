// login.component.ts
import { Component, HostListener } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  showPassword: boolean = false;
  loading: boolean = false;
  loginError: string = ''; // <-- New variable for error messages

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === 1) this.router.navigate(['/admin']);
      else if (user.role === 2) this.router.navigate(['/home-staff']);
      else if (user.role === 3 && !user.detailsCompleted) this.router.navigate(['/edit-profile']);
      else this.router.navigate(['/']);
    }
  }

  public get email() { return this.loginForm.get('email'); }
  public get password() { return this.loginForm.get('password'); }

  togglePassword(): void { this.showPassword = !this.showPassword; }

  onSubmit(): void {
    this.loginError = ''; // reset previous errors

    if (!this.loginForm.valid) {
      this.loginError = 'Please enter a valid email and password.';
      return;
    }

    this.loading = true;

    this.authService.login(this.loginForm.value).subscribe({
      next: (res: any) => {
        if (!res.token || !res.user) {
          this.loginError = res.message || 'Invalid email or password.';
          return;
        }

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        // Redirect based on role
        if (res.user.role === 1) this.router.navigate(['/admin']);
        else if (res.user.role === 2) this.router.navigate(['/home-staff']);
        else if (res.user.role === 3) {
          if (!res.user.detailsCompleted) this.router.navigate(['/edit-profile']);
          else this.router.navigate(['/']);
        } else this.router.navigate(['/']);
      },
      error: (err) => {
        console.error('Login failed:', err);
        this.loginError = err.error?.message || 'Incorrect email or password.';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    const navBg = document.querySelector('.login-bg') as HTMLElement | null;
    if (navBg) {
      const x = (event.clientX / window.innerWidth - 0.5) * 20;
      const y = (event.clientY / window.innerHeight - 0.5) * 20;
      navBg.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
    }
  }

  goToRegister(): void { this.router.navigate(['/register']); }
  goToForgotPassword(event: Event): void { event.preventDefault(); this.router.navigate(['/']); }
  goToOtp(): void { this.router.navigate(['/otpverify']); }
}
