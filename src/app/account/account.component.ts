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
  isFirstLogin = false;
  selectedFile: File | null = null;

  showSuccessModal = false;
  showErrorModal = false;
  errorModalMessage = '';
  showPasswordField = false;

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

  checkFirstLogin(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === 1) return;
      if (!user.detailsCompleted) {
        this.isFirstLogin = true;
        this.toggleEdit();
      }
    }
  }

  loadAccountData(): void {
    const token = localStorage.getItem('token');
    if (!token) {
      this.router.navigate(['/login']);
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      this.profileForm.patchValue({ email: user.email ?? '' });
    }

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
          this.checkFirstLogin();
        },
        error: () => {
          console.warn('No user details found.');
          this.checkFirstLogin();
        }
      });
  }

  toggleEdit(): void {
    this.editMode = true;
    const editableFields = ['firstName', 'middleName', 'lastName', 'address', 'contactNo', 'newPassword'];
    editableFields.forEach(field => this.profileForm.get(field)?.enable());
  }

  cancelEdit(): void {
    this.editMode = false;
    this.showPasswordField = false;
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.disable();
    });
    this.loadAccountData();
  }

  // ← the missing method
  togglePasswordField(): void {
    this.showPasswordField = !this.showPasswordField;
    if (!this.showPasswordField) {
      this.profileForm.get('newPassword')?.setValue('');
    }
  }

  closeSuccessModal(): void {
    this.showSuccessModal = false;
  }

  closeErrorModal(): void {
    this.showErrorModal = false;
    this.errorModalMessage = '';
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  saveProfile(): void {
    const token = localStorage.getItem('token');
    if (!token) return;

    const firstName = this.profileForm.get('firstName')?.value?.trim();
    const lastName  = this.profileForm.get('lastName')?.value?.trim();
    const address   = this.profileForm.get('address')?.value?.trim();
    const contactNo = this.profileForm.get('contactNo')?.value?.trim();

    const missing: string[] = [];
    if (!firstName) missing.push('First Name');
    if (!lastName)  missing.push('Last Name');
    if (!address)   missing.push('Home Address');
    if (!contactNo) missing.push('Contact Number');

    if (missing.length > 0) {
      this.errorModalMessage = `Please fill in the following required fields: ${missing.join(', ')}.`;
      this.showErrorModal = true;
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const newPassword = this.profileForm.get('newPassword')?.value;

    const body: any = {
      firstName,
      middleName: this.profileForm.get('middleName')?.value,
      lastName,
      address,
      contactNo
    };

    if (newPassword && newPassword.trim() !== '') {
      body.newPassword = newPassword;
    }

    this.http.post('https://drtbackend-2cw3.onrender.com/api/user/details', body, { headers })
      .subscribe({
        next: () => {
          const wasFirstLogin = this.isFirstLogin;

          const storedUser = localStorage.getItem('user');
          let userRole = 0;
          if (storedUser) {
            const user = JSON.parse(storedUser);
            user.detailsCompleted = true;
            userRole = user.role;
            localStorage.setItem('user', JSON.stringify(user));
          }

          this.isFirstLogin = false;
          this.editMode = false;
          this.showPasswordField = false;

          Object.keys(this.profileForm.controls).forEach(key => {
            this.profileForm.get(key)?.disable();
          });

          this.loadAccountData();

          if (wasFirstLogin) {
            if (userRole === 2) {
              this.router.navigate(['/home-staff']);
            } else {
              this.router.navigate(['/']);
            }
          } else {
            this.showSuccessModal = true;
          }
        },
        error: (err) => {
          console.error('Failed to update user details:', err);
          this.errorModalMessage = 'Failed to update profile. Please try again.';
          this.showErrorModal = true;
        }
      });
  }

  deleteAccount(): void {
    const confirmDelete = confirm('Are you sure you want to delete your account? This cannot be undone.');
    if (!confirmDelete) return;

    const token = localStorage.getItem('token');
    if (!token) {
      alert('No authentication token found. Please log in again.');
      return;
    }

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const storedUser = localStorage.getItem('user');
    const userId = storedUser ? JSON.parse(storedUser).id : null;

    if (!userId) {
      alert('Unable to delete account: User ID not found.');
      return;
    }

    this.http.delete(`https://drtbackend-2cw3.onrender.com/api/admin/users/${userId}`, { headers })
      .subscribe({
        next: (res: any) => {
          alert(res.message || 'Account deleted.');
          this.logout();
        },
        error: (err) => {
          if (err.error && err.error.message) {
            alert(`Failed to delete account: ${err.error.message}`);
          } else {
            alert(`Failed to delete account. Status: ${err.status} ${err.statusText}`);
          }
        }
      });
  }
}
