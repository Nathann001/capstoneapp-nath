import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { timer } from 'rxjs';

@Component({
  selector: 'app-otpverify',
  standalone: true,
  templateUrl: './otpverify.component.html',
  styleUrls: ['./otpverify.component.css'],
  imports: [CommonModule, ReactiveFormsModule]
})
export class OtpVerificationComponent implements OnInit {
  otpForm: FormGroup;
  loading = false;
  resendCooldown = 0;
  contact: string = '';
  message: string = '';
  resendError: string = '';
  verifyError: string = '';
  otpSent = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.otpForm = this.fb.group({
      contact: ['', [Validators.required]],
      otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
    });
  }

  ngOnInit() {
    const stateContact = history.state?.contact;
    const savedContact = sessionStorage.getItem('otpContact');

    if (stateContact) {
      this.contact = stateContact;
      sessionStorage.setItem('otpContact', this.contact);
    } else if (savedContact) {
      this.contact = savedContact;
    }

    this.otpForm.get('contact')?.setValue(this.contact);
  }

  onSubmit() {
    if (this.otpForm.invalid) return;

    this.loading = true;
    this.verifyError = '';
    const contact = this.otpForm.get('contact')?.value;
    const otp = this.otpForm.get('otp')?.value;

    const payload: any = { otp };
    if (contact.includes('@')) payload.email = contact;
    else payload.phone = contact;

    this.authService.verifyOtp(payload).subscribe({
      next: (res) => {
        console.log(res.message || 'Verification successful!');
        sessionStorage.setItem('otpContact', contact);
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.verifyError = err.error?.message || 'OTP verification failed. Please try again.';
        this.loading = false;
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  resendOtp() {
    if (this.resendCooldown > 0) return;

    const contact = this.otpForm.get('contact')?.value;

    if (!contact) {
      this.resendError = 'Please enter your email or phone number.';
      return;
    }

    this.message = '';
    this.resendError = '';

    this.authService.resendOtp(contact).subscribe({
      next: () => {
        this.message = 'OTP resent successfully!';
        this.resendError = '';
        this.otpSent = true;
        this.resendCooldown = 60;

        const countdown$ = timer(0, 1000);
        const sub = countdown$.subscribe((sec) => {
          this.resendCooldown = 60 - sec;
          if (this.resendCooldown <= 0) {
            sub.unsubscribe();
            this.resendCooldown = 0;
            this.message = '';
          }
        });
      },
      error: (err) => {
        this.resendError = err.error?.message || 'Failed to resend OTP. Please try again.';
        this.message = '';
      }
    });
  }
}
