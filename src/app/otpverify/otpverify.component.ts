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


  constructor(
  private fb: FormBuilder,
  private authService: AuthService,
  private router: Router
) {
  this.otpForm = this.fb.group({
  contact: ['', [Validators.required]], // Editable email/phone
  otp: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(6)]]
});

}


  ngOnInit() {
  // Try to prefill from navigation state or sessionStorage
  const stateContact = history.state?.contact;
  const savedContact = sessionStorage.getItem('otpContact');

  if (stateContact) {
    this.contact = stateContact;
    sessionStorage.setItem('otpContact', this.contact);
  } else if (savedContact) {
    this.contact = savedContact;
  } else {
    // No saved contact — leave it empty
    this.contact = '';
  }

  // Prefill the form control
  this.otpForm.get('contact')?.setValue(this.contact);
}


  onSubmit() {
  if (this.otpForm.invalid) return;

  this.loading = true;
  const contact = this.otpForm.get('contact')?.value;
  const otp = this.otpForm.get('otp')?.value;

  const payload: any = { otp };
  if (contact.includes('@')) payload.email = contact;
  else payload.phone = contact;

  this.authService.verifyOtp(payload).subscribe({
    next: (res) => {
      alert(res.message || 'Verification successful!');
      sessionStorage.setItem('otpContact', contact); // remember for next time
      this.router.navigate(['/login']);
    },
    error: (err) => {
      alert(err.error?.message || 'OTP verification failed');
    },
    complete: () => {
      this.loading = false;
    }
  });
}

resendOtp() {
  if (this.resendCooldown > 0) return;

  this.authService.resendOtp(this.contact).subscribe({
    next: () => {
      this.message = 'OTP resent successfully!';
      this.resendCooldown = 60;

      // Use RxJS timer for countdown
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
      this.message = err.error?.message || 'Failed to resend OTP';
    }
  });
}
}
