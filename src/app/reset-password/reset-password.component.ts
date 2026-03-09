import { Component } from '@angular/core';
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
export class ResetPasswordComponent {
  step: 1 | 2 = 1;
  emailForm: FormGroup;
  resetForm: FormGroup;
  message = '';
  error = '';
  loading = false;
  submittedEmail = '';
  showPassword = false;
  showConfirm = false;

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

  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
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
      },
      error: (err) => {
        this.error = err.error?.message || 'Something went wrong. Please try again.';
        this.loading = false;
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
