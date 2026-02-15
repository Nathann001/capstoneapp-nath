import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Added RouterModule
import { HttpClient } from '@angular/common/http'; // Needed for onVerifyOtp
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  // Added RouterModule to imports so routerLink works
  imports: [CommonModule, ReactiveFormsModule, FormsModule, RouterModule] 
})
export class RegisterComponent {
  registerForm: FormGroup;
  showPassword = false;
  showConfirmPassword = false;
  loading = false;
  isOtpSent = false; // Added missing variable
  otpCode = '';     // Added missing variable

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private http: HttpClient // Injected for the OTP verification method
  ) {
    this.registerForm = this.fb.group({
      // Changed 'contact' to 'email' to match your HTML formControlName
      email: ['', [Validators.required, Validators.email]], 
      password: ['', Validators.required],
      confirmPassword: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    const { email, password, confirmPassword } = this.registerForm.value;

    if (password !== confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    this.loading = true;

    // Passing contact and password to match AuthService interface
    this.authService.register({ contact: email, password }).subscribe({
      next: (res) => {
        console.log('Registration successful:', res);
        this.isOtpSent = true; // Show the OTP input section
      },
      error: (err) => {
        console.error('Registration error:', err);
        alert(err.error?.message || 'Registration failed');
        this.loading = false;
      }
    });
  }

  onVerifyOtp() {
    const payload = {
      email: this.registerForm.value.email,
      otp: parseInt(this.otpCode) 
    };

    this.http.post('http://localhost:4000/api/auth/verify-otp', payload).subscribe({
      next: (res: any) => {
        alert('Account verified! Redirecting to login...');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        alert(err.error?.message || 'Verification failed');
      }
    });
  }

  togglePassword() { this.showPassword = !this.showPassword; }
  toggleConfirmPassword() { this.showConfirmPassword = !this.showConfirmPassword; }
  goToLogin(): void { this.router.navigate(['/login']); }
}