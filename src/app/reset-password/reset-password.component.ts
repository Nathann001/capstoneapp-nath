import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent implements OnDestroy {
  step: 1 | 2 = 1;
  emailForm: FormGroup;
  resetForm: FormGroup;
  message = '';
  error = '';
  loading = false;
  resendLoading = false;
  submittedEmail = '';
  showPassword = false;
  showConfirm = false;

  // Resend cooldown
  resendCooldown = 0;
  private resendInterval: any = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.emailForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.resetForm = this.fb.group({
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnDestroy() {
    if (this.resendInterval) clearInterval(this.resendInterval);
  }

  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  private startCooldown() {
    this.resendCooldown = 60;
    if (this.resendInterval) clearInterval(this.resendInterval);
    this.resendInterval = setInterval(() => {
      this.resendCooldown--;
      if (this.resendCooldown <= 0) {
        clearInterval(this.resendInterval);
        this.resendInterval = null;
      }
    }, 1000);
  }

  requestOtp(): void {
    this.message = '';
    this.error = '';
    if (this.emailForm.invalid) return;

    this.loading = true;
    this.submittedEmail = this.emailForm.value.email;

    this.http.post('https://drtbackend-2cw3.onrender.com/api/auth/forgot-password', {
      email: this.submittedEmail
    }).subscribe({
      next: () => {
        this.step = 2;
        this.message = 'OTP sent to your email.';
        this.loading = false;
        this.startCooldown();
      },
      error: (err) => {
        this.error = err.error?.message || 'Something went wrong. Please try again.';
        this.loading = false;
      }
    });
  }

  resendOtp(): void {
    if (this.resendCooldown > 0 || this.resendLoading) return;

    this.message = '';
    this.error = '';
    this.resendLoading = true;

    this.http.post('https://drtbackend-2cw3.onrender.com/api/auth/forgot-password', {
      email: this.submittedEmail
    }).subscribe({
      next: () => {
        this.message = 'A new OTP has been sent to your email.';
        this.resendLoading = false;
        this.startCooldown();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to resend OTP. Please try again.';
        this.resendLoading = false;
      }
    });
  }

  submit(): void {
    this.message = '';
    this.error = '';
    if (this.resetForm.invalid) return;

    this.loading = true;
    const { otp, password } = this.resetForm.value;

    this.http.post('https://drtbackend-2cw3.onrender.com/api/auth/reset-password', {
      email: this.submittedEmail,
      otp,
      newPassword: password
    }).subscribe({
      next: (res: any) => {
        this.message = res.message || 'Password reset successful!';
        this.resetForm.reset();
        setTimeout(() => this.router.navigate(['/login']), 2000);
      },
      error: (err) => {
        this.error = err.error?.message || 'Something went wrong. Please try again.';
        this.loading = false;
      },
      complete: () => { this.loading = false; }
    });
  }
}
