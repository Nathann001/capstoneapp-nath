import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

interface UserDetails {
  User_FName: string;
  User_MName: string;
  User_LName: string;
  User_Address: string;
  User_ContactNo: string;
}

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './account.component.html',
  styleUrls: ['./account.component.css']
})
export class AccountComponent implements OnInit {
  profileForm: FormGroup;
  editMode = false;

  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      firstName: [{ value: '', disabled: true }],
      middleName: [{ value: '', disabled: true }],
      lastName: [{ value: '', disabled: true }],
      address: [{ value: '', disabled: true }],
      contactNo: [{ value: '', disabled: true }],
      newPassword: [{ value: '', disabled: true }]
    });
  }

  ngOnInit(): void {
    this.loadAccountData();
  }

  // 🔹 Load account data
  loadAccountData(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    // Load email from localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.profileForm.patchValue({
        email: user.email ?? ''
      });
    }

    // Load user details from DB
    this.http.get<UserDetails>('https://drtbackend-2cw3.onrender.com/api/user/details', { headers })
      .subscribe({
        next: (details) => {
          this.profileForm.patchValue({
            firstName: details.User_FName ?? '',
            middleName: details.User_MName ?? '',
            lastName: details.User_LName ?? '',
            address: details.User_Address ?? '',
            contactNo: details.User_ContactNo ?? ''
          });
        },
        error: () => {
          console.warn('No user details found.');
        }
      });
  }

  // 🔹 Enable edit mode
  toggleEdit(): void {
    this.editMode = true;

    const editableFields = [
      'firstName',
      'middleName',
      'lastName',
      'address',
      'contactNo',
      'newPassword'
    ];

    editableFields.forEach(field => {
      this.profileForm.get(field)?.enable();
    });
  }

  // 🔹 Cancel editing
  cancelEdit(): void {
    this.editMode = false;

    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.disable();
    });

    this.loadAccountData();
  }

  // 🔹 Logout
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  // 🔹 Save profile
  saveProfile(): void {
  const token = localStorage.getItem('token');
  if (!token) return;

  const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

  const body = {
    firstName: this.profileForm.get('firstName')?.value,
    middleName: this.profileForm.get('middleName')?.value,
    lastName: this.profileForm.get('lastName')?.value,
    address: this.profileForm.get('address')?.value,
    contactNo: this.profileForm.get('contactNo')?.value
  };

  // 🔹 MUST be POST (not PUT)
  this.http.post('https://drtbackend-2cw3.onrender.com/api/user/details', body, { headers })
    .subscribe({
      next: () => {
        alert('Profile details updated successfully!');
        this.editMode = false;
        this.loadAccountData();
      },
      error: (err) => {
        console.error('Failed to update user details:', err);
        alert('Failed to update profile details.');
      }
    });
}

  // 🔹 Delete account
  deleteAccount(): void {
    const confirmDelete = confirm('Are you sure you want to delete your account?');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    this.http.delete('https://drtbackend-2cw3.onrender.com/api/admin/users/${userId}', { headers })
      .subscribe({
        next: () => {
          alert('Account deleted.');
          this.logout();
        },
        error: () => {
          alert('Failed to delete account.');
        }
      });
  }
}
