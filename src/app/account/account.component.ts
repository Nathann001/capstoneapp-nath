import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';

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
  imageUrl: string | null = null;
  selectedFile: File | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private http: HttpClient
  ) {
    this.profileForm = this.fb.group({
      username: [{ value: '', disabled: true }, Validators.required],
      email: [{ value: '', disabled: true }, [Validators.required, Validators.email]],
      role: [{ value: '', disabled: true }],
      newPassword: ['']
    });
  }

  ngOnInit() {
    this.loadUserInfo();
  }

  loadUserInfo() {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      this.router.navigate(['/login']);
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      this.profileForm.patchValue({
        username: user.username ?? '',
        email: user.email ?? '',
        role: user.role ?? ''
      });

      // Use Cloudinary/full URLs directly (no hardcoded backend path)
      this.imageUrl = user.image ?? null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      this.router.navigate(['/login']);
    }
  }

  toggleEdit() {
    this.editMode = !this.editMode;
    ['username', 'email'].forEach(control => {
      const formControl = this.profileForm.get(control);
      if (this.editMode) formControl?.enable();
      else formControl?.disable();
    });

    if (this.editMode) {
      this.profileForm.get('newPassword')?.enable();
    } else {
      this.profileForm.get('newPassword')?.disable();
    }
  }

  onFileSelected(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => this.imageUrl = reader.result as string;
      reader.readAsDataURL(file);
    }
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  saveProfile() {
    const token = localStorage.getItem('token');
    if (!token) return;

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    const formData = new FormData();

    formData.append('username', this.profileForm.get('username')?.value);
    formData.append('email', this.profileForm.get('email')?.value);

    if (this.profileForm.get('newPassword')?.value) {
      formData.append('newPassword', this.profileForm.get('newPassword')?.value);
    }

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.http.put('https://its-certificate-generator.onrender.com/api/auth/update', formData, { headers }).subscribe({
      next: (res: any) => {
        console.log('Profile updated successfully!');
        if (res.user) localStorage.setItem('user', JSON.stringify(res.user));
        this.editMode = false;
        this.loadUserInfo();
      },
      error: (err) => {
        console.error('Failed to update profile:', err);
        console.log('Failed to update profile.');
      }
    });
  }

  cancelEdit() {
    this.editMode = false;
    this.loadUserInfo();
  }

  deleteAccount() {
    const token = localStorage.getItem('token');
    if (!token) return console.log('No active session found. Please log in again.');

    const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);
    this.http.delete('https://its-certificate-generator.onrender.com/api/user/delete', { headers }).subscribe({
      next: () => {
        console.log('Your account has been deleted.');
        this.logout();
      },
      error: (err) => {
        console.error('Error deleting account:', err);
        console.log('Failed to delete account.');
      }
    });
  }
}
