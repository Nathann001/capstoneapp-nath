import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-profile.component.html',
  styleUrls: ['./edit-profile.component.css']
})
export class EditProfileComponent {
  profileForm: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.profileForm = this.fb.group({
      firstName: ['', Validators.required],
      middleName: [''],
      lastName: ['', Validators.required],
      address: ['', Validators.required],
      contactNo: ['', [Validators.required, Validators.pattern(/^[0-9]{10,15}$/)]]
    });
  }

  submit() {
    if (this.profileForm.invalid) {
      alert('Please fill all required fields correctly.');
      return;
    }

    this.loading = true;
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    this.http.post('https://drtbackend-2cw3.onrender.com/api/user/details', this.profileForm.value, { headers })
      .subscribe({
        next: (res: any) => {
          alert(res.message || 'Profile saved successfully!');
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          user.detailsCompleted = true;
          localStorage.setItem('user', JSON.stringify(user));
          this.router.navigate(['/']); // redirect to main page
        },
        error: (err) => {
          console.error(err);
          alert(err.error?.message || 'Failed to save profile.');
        },
        complete: () => this.loading = false
      });
  }
}
