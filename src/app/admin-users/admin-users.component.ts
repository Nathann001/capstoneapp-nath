import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AdminService, User } from './admin.service';
import { Router } from '@angular/router';

interface Role {
  value: number;
  label: string;
}

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  users: User[] = [];
  roles: Role[] = [
    { value: 1, label: 'Admin' },
    { value: 2, label: 'Staff' },
    { value: 3, label: 'User' }
  ];
  searchTerm: string = '';
  filterRole: number | '' = '';
  filteredUsers: any[] = [];

  createForm: FormGroup;
  editForm: FormGroup;
  selectedUser: User | null = null;
  loading = false;

  constructor(private fb: FormBuilder, private adminService: AdminService, private router: Router) {
    this.createForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: [2, Validators.required], // default Staff
      can_create_admins: [false] // only relevant for Admins
    });

    this.editForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [2, Validators.required],
      password: [''],
      can_create_admins: [false]
    });
  }

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe({
      next: (res: User[]) => {
        this.users = res;
        this.applyFilter();
      },
      error: (err: any) => {
        console.error('Error loading users', err);
        if (err.status === 401) this.router.navigate(['/login']);
      }
    });
  }

  applyFilter() {
    this.filteredUsers = this.users.filter(user => {
      if (this.filterRole && user.role !== this.filterRole) return false;
      const fullName = user.full_name?.toLowerCase() || '';
      const email = user.email?.toLowerCase() || '';
      const term = this.searchTerm.toLowerCase();
      return fullName.includes(term) || email.includes(term);
    });
  }

  onSearchChange(term: string) {
    this.searchTerm = term;
    this.applyFilter();
  }

  onRoleFilterChange(role: string) {
    this.filterRole = role ? +role : '';
    this.applyFilter();
  }

  getRoleLabel(roleValue: number): string {
    const role = this.roles.find(r => r.value === roleValue);
    return role ? role.label : 'Unknown';
  }

  createUser() {
  if (this.createForm.invalid) {
    console.error('Form is invalid');
    return;
  }

  this.loading = true;

  // Convert role to number
  const formValue = { ...this.createForm.value, role: Number(this.createForm.value.role) };

  // Ensure role is valid (1 = admin, 2 = staff)
  if (![1, 2].includes(formValue.role)) {
    console.error('Invalid role:', formValue.role);
    this.loading = false;
    return;
  }

  // Only allow can_create_admins if role === 1 (admin)
  if (formValue.role !== 1) {
    formValue.can_create_admins = false;
  }

  console.log('Creating user with payload:', formValue);

  this.adminService.createUser(formValue).subscribe({
    next: (res: any) => {
      console.log(res.message);
      this.createForm.reset({ role: 2, can_create_admins: false });
      this.loadUsers();
    },
    error: (err: any) => console.error(err.error?.message || 'Failed to create user'),
    complete: () => this.loading = false
  });
}


  selectUser(user: User) {
    this.selectedUser = user;
    this.editForm.patchValue({
      email: user.email,
      role: user.role,
      password: '',
      can_create_admins: (user as any).can_create_admins || false
    });
  }

  updateUser() {
    if (!this.selectedUser || this.editForm.invalid) return;
    this.loading = true;

    const payload: any = {
      email: this.editForm.value.email,
      role: Number(this.editForm.value.role)
    };

    if (payload.role === 1) payload.can_create_admins = this.editForm.value.can_create_admins;

    this.adminService.updateUser(this.selectedUser.id, payload).subscribe({
      next: (res: any) => {
        const newPassword = this.editForm.value.password;
        if (newPassword) {
          this.adminService.updateUserPassword(this.selectedUser!.id, newPassword).subscribe({
            next: () => {
              console.log('User credentials and password updated successfully');
              this.selectedUser = null;
              this.loadUsers();
            },
            error: (err) => console.error(err.error?.message || 'Failed to update password'),
            complete: () => this.loading = false
          });
        } else {
          console.log('User updated successfully');
          this.selectedUser = null;
          this.loadUsers();
          this.loading = false;
        }
      },
      error: (err: any) => {
        console.error(err.error?.message || 'Failed to update user');
        this.loading = false;
      }
    });
  }

  cancelEdit() {
    this.selectedUser = null;
  }

  deleteUser(id: number) {
    if (!confirm('Are you sure you want to delete this user?')) return;

    this.adminService.deleteUser(id).subscribe({
      next: (res: any) => {
        console.log(res.message);
        this.loadUsers();
      },
      error: (err: any) => console.error(err.error?.message || 'Failed to delete user')
    });
  }
}
