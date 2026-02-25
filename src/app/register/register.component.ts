import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';
import { timer } from 'rxjs';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule]
})
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  verifying = false;
  isOtpSent = false;
  otpCode = '';
  resendCooldown = 0;
  resendMessage = '';

  // Modal
  showErrorModal = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) return;

    const { email, password, confirmPassword } = this.registerForm.value;
    if (password !== confirmPassword) {
      this.showError('Passwords do not match!');
      return;
    }

    this.loading = true;

    this.authService.register({ contact: email, password }).subscribe({
      next: () => {
        this.isOtpSent = true;
        this.loading = false;
        this.startResendCooldown();
      },
      error: (err) => {
        this.showError(err.error?.message || 'Registration failed');
        this.loading = false;
      }
    });
  }

  onVerifyOtp() {
    if (!this.otpCode || this.otpCode.length < 6) return;

    this.verifying = true;

    const payload = {
      email: this.registerForm.value.email,
      otp: parseInt(this.otpCode)
    };

    this.http.post('https://drtbackend-2cw3.onrender.com/api/auth/verify-otp', payload).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (err) => {
        // Show modal instead of alert
        this.showError(err.error?.message || 'Invalid OTP. Please try again.');
        this.verifying = false;
        this.otpCode = ''; // Clear the input so user can re-enter
      }
    });
  }

  resendOtp() {
    if (this.resendCooldown > 0) return;

    const email = this.registerForm.value.email;
    if (!email) return;

    this.authService.resendOtp(email).subscribe({
      next: () => {
        this.resendMessage = 'OTP resent successfully!';
        this.startResendCooldown();
      },
      error: (err) => {
        this.resendMessage = err.error?.message || 'Failed to resend OTP';
      }
    });
  }

  showError(message: string) {
    this.errorMessage = message;
    this.showErrorModal = true;
  }

  closeErrorModal() {
    this.showErrorModal = false;
    this.errorMessage = '';
  }

  private startResendCooldown() {
    this.resendCooldown = 60;
    const sub = timer(0, 1000).subscribe((sec) => {
      this.resendCooldown = 60 - sec;
      if (this.resendCooldown <= 0) {
        sub.unsubscribe();
        this.resendCooldown = 0;
        this.resendMessage = '';
      }
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }
  goToLogin(): void { this.router.navigate(['/login']); }
}
