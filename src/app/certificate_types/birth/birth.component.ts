import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-birth',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './birth.component.html',
  styleUrls: ['./birth.component.css']
})
export class BirthComponent {
  documentForm: FormGroup;
  files: { [key: number]: File | null } = {
    1: null,
    2: null,
    3: null
  };

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

  fileRequirements = [
    { number: 1, label: 'Affidavit of Admission of Paternity',        hint: 'Affidavit of Acknowledgment/Admission of Paternity',         required: true },
    { number: 2, label: 'Affidavit to Use the Surname of the Father', hint: 'Affidavit to Use the Surname of the Father (RA 9255)',        required: true },
    { number: 3, label: 'Birth Certificate',                           hint: 'Upload a copy of the duly accomplished birth certificate',   required: true }
  ];

  documentType = 'Birth Certificate';

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router) {
    this.documentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  get f() {
    return this.documentForm.controls;
  }

  onFileSelected(event: any, fileNumber: number) {
    if (event.target.files.length > 0) {
      this.files[fileNumber] = event.target.files[0];
    }
  }

  areRequiredFilesSelected(): boolean {
    return this.files[1] !== null &&
           this.files[2] !== null &&
           this.files[3] !== null;
  }

  isFileSelected(fileNumber: number): boolean {
    return this.files[fileNumber] !== null;
  }

  getFileName(fileNumber: number): string {
    return this.files[fileNumber]?.name || 'No file selected';
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

    if (!this.areRequiredFilesSelected()) {
      this.showModal('warning', 'Missing Documents', 'Please upload all 3 required documents before submitting.');
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

    for (let i = 1; i <= 3; i++) {
      if (this.files[i]) {
        formData.append('files', this.files[i]!, this.files[i]!.name);
      }
    }

    this.isSubmitting = true;

    this.http.post('https://drtbackend-2cw3.onrender.com/api/document_request', formData, { headers })
      .subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          this.documentForm.reset();
          this.files = { 1: null, 2: null, 3: null };
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
    this.files = { 1: null, 2: null, 3: null };
    this.documentForm.reset();
  }
}