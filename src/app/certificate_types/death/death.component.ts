import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

function nameValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;
  const valid = /^[a-zA-ZÀ-ÖØ-öø-ÿ\s\-\.]+$/.test(value);
  return valid ? null : { invalidName: true };
}

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'application/pdf'
];

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.pdf'];

@Component({
  selector: 'app-death',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './death.component.html',
  styleUrl: './death.component.css'
})
export class DeathComponent {

  documentForm: FormGroup;

  files: { [key: number]: File | null } = {
    1: null
  };

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
    { number: 1, label: 'Valid ID', hint: 'Upload one valid government ID (JPG, PNG, WEBP, or PDF only)', required: true }
  ];

  documentType = 'death';

  validIdTypes = [
    'Philippine Passport',
    'SSS / UMID Card',
    'PhilHealth ID',
    'Pag-IBIG / HDMF ID',
    'Driver\'s License',
    'Voter\'s ID / COMELEC ID',
    'Philippine National ID (PhilSys)',
    'Postal ID',
    'PRC ID (Professional Regulation Commission)',
    'Senior Citizen ID',
    'PWD ID (Persons with Disability)',
    'OFW ID / iDOLE Card',
    'NBI Clearance',
    'Police Clearance',
    'Barangay ID',
    'School ID (for minors)',
    'TIN ID'
  ];

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.documentForm = this.fb.group({
      First_Name:    ['', [Validators.required, nameValidator]],
      Middle_Name:   ['', [Validators.required, nameValidator]],
      Last_Name:     ['', [Validators.required, nameValidator]],
      Doc_Date:      ['', Validators.required],
      Death_Place:   ['', Validators.required],
      Valid_ID_Type: ['', Validators.required],
    });
  }

  get f() {
    return this.documentForm.controls;
  }

  onFileSelected(event: any, fileNumber: number) {
    const file: File = event.target.files[0];
    if (!file) return;

    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidMime = ALLOWED_MIME_TYPES.includes(file.type);
    const isValidExt = ALLOWED_EXTENSIONS.includes(extension);

    if (!isValidMime || !isValidExt) {
      this.showModal(
        'warning',
        'Invalid File Type',
        'Only JPG, PNG, WEBP, and PDF files are allowed. GIFs and other formats are not accepted.'
      );
      event.target.value = '';
      this.files[fileNumber] = null;
      return;
    }

    this.files[fileNumber] = file;
  }

  areRequiredFilesSelected(): boolean {
    return this.files[1] !== null;
  }

  isFileSelected(fileNumber: number): boolean {
    return this.files[fileNumber] !== null;
  }

  getFileName(fileNumber: number): string {
    return this.files[fileNumber]?.name || 'No file selected';
  }

  showModal(type: 'success' | 'error' | 'warning', title: string, message: string, requestId?: string) {
    this.modal = { visible: true, type, title, message, requestId };
  }

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
      this.showModal(
        'warning',
        'Missing Document',
        'Please upload your Valid ID before submitting.'
      );
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
    formData.append('document_type', this.documentType);
    formData.append('First_Name', this.documentForm.value.First_Name.trim());
    formData.append('Middle_Name', this.documentForm.value.Middle_Name.trim());
    formData.append('Last_Name', this.documentForm.value.Last_Name.trim());
    formData.append('Doc_Date', this.documentForm.value.Doc_Date);
    formData.append('Death_Place', this.documentForm.value.Death_Place.trim());
    formData.append('Valid_ID_Type', this.documentForm.value.Valid_ID_Type);

    if (this.files[1]) {
      formData.append('files', this.files[1], this.files[1]!.name);
    }

    this.isSubmitting = true;

    this.http.post(
      'https://drtbackend-2cw3.onrender.com/api/document_request',
      formData,
      { headers }
    ).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.documentForm.reset();
        this.files = { 1: null };

        this.showModal(
          'success',
          'Request Submitted!',
          'Your Death Certificate request has been successfully submitted.',
          res.requestId
        );
      },
      error: (err: any) => {
        this.isSubmitting = false;

        if (err.status === 401) {
          this.showModal('error', 'Unauthorized', 'Your session has expired. Please log in again.');
        } else {
          this.showModal(
            'error',
            'Submission Failed',
            'Failed to submit your request. ' + (err.error?.error || err.message)
          );
        }
      }
    });
  }

  resetFiles() {
    this.files = { 1: null };
    this.documentForm.reset();
  }
}
