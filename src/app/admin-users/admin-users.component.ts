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
  filteredUsers: any[] = [];
  searchTerm: string = '';
  filterRole: number | '' = '';

  createForm: FormGroup;
  editForm: FormGroup;
  selectedUser: User | null = null;
  loading = false;

  // Panel/modal state
  showCreateForm = false;
  showEditModal = false;
  showDeleteModal = false;
  userToDelete: User | null = null;

  // Current logged-in admin's permission
  currentUserCanCreateAdmins: boolean = false;
  currentUserCanEditAdmins: boolean = false;
  currentUserCanDeleteAdmins: boolean = false

  // Role options — dynamically filtered based on currentUserCanCreateAdmins
  // Role 3 (User) is never shown — admins only create Admin or Staff
  get availableRoles(): Role[] {
    const roles: Role[] = [{ value: 2, label: 'Staff' }];
    if (this.currentUserCanCreateAdmins) {
      roles.unshift({ value: 1, label: 'Admin' });
    }
    return roles;
  }

  // Roles shown in the filter dropdown (includes Admin only if current user can create admins)
  get filterRoles(): Role[] {
    return this.availableRoles;
  }

  constructor(private fb: FormBuilder, private adminService: AdminService, private router: Router) {
    this.createForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: [2, Validators.required],
      can_create_admins: [false],
      can_edit_admins: [false],
      can_delete_admins: [false]
    });

    this.editForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      role: [2, Validators.required],
      password: [''],
      can_create_admins: [false],
      can_edit_admins: [false],
      can_delete_admins: [false]
    });
  }

  ngOnInit() {
    try {
      const stored = localStorage.getItem('user');
      if (stored) {
        const parsed = JSON.parse(stored);
        this.currentUserCanCreateAdmins = !!parsed.can_create_admins;
        this.currentUserCanEditAdmins = !!parsed.can_edit_admins;
        this.currentUserCanDeleteAdmins = !!parsed.can_delete_admins;
      }
    } catch {
      this.currentUserCanCreateAdmins = false;
      this.currentUserCanEditAdmins = false;
      this.currentUserCanDeleteAdmins = false;
    }
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
    const map: Record<number, string> = { 1: 'Admin', 2: 'Staff', 3: 'User' };
    return map[roleValue] ?? 'Unknown';
  }

  toggleCreateForm() {
    this.showCreateForm = !this.showCreateForm;
    if (!this.showCreateForm) {
    this.createForm.reset({ role: 2, can_create_admins: false, can_edit_admins: false, can_delete_admins: false });
    }
  }

  createUser() {
    if (this.createForm.invalid) return;
    this.loading = true;

    const formValue = { ...this.createForm.value, role: Number(this.createForm.value.role) };

    // Never allow role 3 from this form
    if (![1, 2].includes(formValue.role)) {
      this.loading = false;
      return;
    }

    // Strip can_create_admins if not an admin or current user can't grant it
    if (formValue.role !== 1 || !this.currentUserCanCreateAdmins) formValue.can_create_admins = false;
    if (formValue.role !== 1 || !this.currentUserCanEditAdmins)   formValue.can_edit_admins = false;
    if (formValue.role !== 1 || !this.currentUserCanDeleteAdmins) formValue.can_delete_admins = false;

    this.adminService.createUser(formValue).subscribe({
      next: (res: any) => {
        console.log(res.message);
        this.createForm.reset({ role: 2, can_create_admins: false, can_edit_admins: false, can_delete_admins: false });
        this.showCreateForm = false;
        this.loadUsers();
      },
      error: (err: any) => console.error(err.error?.message || 'Failed to create user'),
      complete: () => this.loading = false
    });
  }

  // Open edit modal
  selectUser(user: User) {
    this.selectedUser = user;
    this.editForm.patchValue({
      email: user.email,
      role: user.role,
      password: '',
      can_create_admins: user.can_create_admins === 1,
      can_edit_admins: user.can_edit_admins === 1,
      can_delete_admins: user.can_delete_admins === 1
    });
    this.showEditModal = true;
  }

  closeEditModal() {
    this.showEditModal = false;
    this.selectedUser = null;
  }

  updateUser() {
    if (!this.selectedUser || this.editForm.invalid) return;
    this.loading = true;

    const role = Number(this.editForm.value.role);

    const payload: any = {
      email: this.editForm.value.email,
      role,
      can_create_admins: (role === 1 && this.currentUserCanCreateAdmins) ? this.editForm.value.can_create_admins : false,
      can_edit_admins:   (role === 1 && this.currentUserCanEditAdmins)   ? this.editForm.value.can_edit_admins   : false,
      can_delete_admins: (role === 1 && this.currentUserCanDeleteAdmins) ? this.editForm.value.can_delete_admins : false,
    };
    this.adminService.updateUser(this.selectedUser.id, payload).subscribe({
      next: () => {
        const newPassword = this.editForm.value.password;
        if (newPassword) {
          this.adminService.updateUserPassword(this.selectedUser!.id, newPassword).subscribe({
            next: () => { this.closeEditModal(); this.loadUsers(); },
            error: (err) => console.error(err.error?.message || 'Failed to update password'),
            complete: () => this.loading = false
          });
        } else {
          this.closeEditModal();
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

  confirmDelete(user: User) {
    this.userToDelete = user;
    this.showDeleteModal = true;
  }

  closeDeleteModal() {
    this.showDeleteModal = false;
    this.userToDelete = null;
  }

  deleteUser() {
    if (!this.userToDelete) return;

    this.adminService.deleteUser(this.userToDelete.id).subscribe({
      next: (res: any) => {
        console.log(res.message);
        this.closeDeleteModal();
        this.loadUsers();
      },
      error: (err: any) => {
        console.error(err.error?.message || 'Failed to delete user');
        this.closeDeleteModal();
      }
    });
  }
}
