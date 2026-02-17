import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-death',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './death.component.html',
  styleUrl: './death.component.css'
})
export class DeathComponent {
  documentForm: FormGroup;
  file1: File | null = null;

  // Modal state
  modal: {
    visible: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
    requestId?: string;
  } = {
    visible: false,
    type: 'success',
    title: '',
    message: ''
  };

  isSubmitting = false;

  documentType = 'Death Certificate';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.documentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  get f() {
    return this.documentForm.controls;
  }

  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.file1 = event.target.files[0];
    }
  }

  isFileSelected(): boolean {
    return this.file1 !== null;
  }

  getFileName(): string {
    return this.file1?.name || 'No file selected';
  }

  // Open a modal dialog
  showModal(type: 'success' | 'error' | 'warning', title: string, message: string, requestId?: string) {
    this.modal = { visible: true, type, title, message, requestId };
  }

  // Close modal; if success, redirect to /documents
  closeModal() {
    const wasSuccess = this.modal.type === 'success';
    this.modal.visible = false;
    if (wasSuccess) {
      this.router.navigate(['/documents']);
    }
  }

  submitDocumentRequest() {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    if (!this.isFileSelected()) {
      this.showModal('warning', 'Missing Document', 'Please upload the required document before submitting.');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.showModal('error', 'Not Logged In', 'You are not logged in. Please log in and try again.');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('name', this.documentForm.value.name);
    formData.append('document_type', this.documentType);
    formData.append('files', this.file1!, this.file1!.name);

    this.isSubmitting = true;

    this.http.post('https://drtbackend-2cw3.onrender.com/api/document_request', formData, { headers })
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          this.documentForm.reset();
          this.file1 = null;
          this.showModal(
            'success',
            'Request Submitted!',
            'Your document request has been successfully submitted.',
            res.requestId
          );
        },
        error: (err: any) => {
          this.isSubmitting = false;
          if (err.status === 401) {
            this.showModal('error', 'Unauthorized', 'Your session has expired. Please log in again.');
          } else {
            this.showModal('error', 'Submission Failed', 'Failed to submit your request. ' + (err.error?.message || err.message));
          }
        }
      });
  }

  resetFiles() {
    this.file1 = null;
    this.documentForm.reset();
  }
}