import { Component } from '@angular/core';
import { FormBuilder, Validators, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    HttpClientModule,
    RouterModule
  ],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css']
})
export class ResetPasswordComponent {
  form: FormGroup;
  message = '';
  error = '';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router   // <-- Inject Router here
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  // Custom validator: check if passwords match
  passwordMatchValidator(group: FormGroup) {
    const pass = group.get('password')?.value;
    const confirm = group.get('confirmPassword')?.value;
    return pass === confirm ? null : { mismatch: true };
  }

  submit(): void {
    this.message = '';
    this.error = '';

    if (this.form.invalid) {
      this.error = "Please fill in all fields correctly.";
      return;
    }

    const { email, password } = this.form.value;

    this.http.post('https://its-certificate-generator.onrender.com/api/auth/reset-password', {
      email,
      newPassword: password
    })
    .subscribe({
      next: (res: any) => {
        this.message = res.message || 'Password reset successful!';
        this.form.reset();

        // Redirect to login after successful reset
        setTimeout(() => {
          this.router.navigate(['/login']); // <-- make sure '/login' matches your route
        }, 2000); // optional 2-second delay to show message
      },
      error: (err) => {
        this.error = err.error?.message || 'Something went wrong.';
      }
    });
  }
}
