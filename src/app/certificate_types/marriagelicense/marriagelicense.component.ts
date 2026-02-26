import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-marriagelicense',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './marriagelicense.component.html',
  styleUrls: ['./marriagelicense.component.css']
})
export class MarriageLicenseComponent {

  documentForm: FormGroup;

  // Files 1–7: required | Files 8–10: optional
  files: { [key: number]: File | null } = {
    1: null,   // Valid ID — Groom
    2: null,   // Valid ID — Bride
    3: null,   // Certificate of Live Birth — Groom
    4: null,   // Certificate of Live Birth — Bride
    5: null,   // PSA CENOMAR — Groom
    6: null,   // PSA CENOMAR — Bride
    7: null,   // Responsible Parenthood Seminar Certificate
    8: null,   // Parental Consent / Advice (optional)
    9: null,   // Annulment Decree or Death Certificate (optional)
    10: null,  // Certificate of Legal Capacity to Marry (optional)
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
  documentType = 'marriage_license';

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private router: Router
  ) {
    this.documentForm = this.fb.group({
      Groom_First_Name:  ['', Validators.required],
      Groom_Middle_Name: ['', Validators.required],
      Groom_Last_Name:   ['', Validators.required],
      Groom_DOB:         ['', Validators.required],
      Bride_First_Name:  ['', Validators.required],
      Bride_Middle_Name: ['', Validators.required],
      Bride_Last_Name:   ['', Validators.required],
      Bride_DOB:         ['', Validators.required],
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

  isFileSelected(fileNumber: number): boolean {
    return this.files[fileNumber] !== null;
  }

  getFileName(fileNumber: number): string {
    return this.files[fileNumber]?.name || 'No file selected';
  }

  /** Count how many of the 7 required files are uploaded. */
  uploadedRequiredCount(): number {
    return [1, 2, 3, 4, 5, 6, 7].filter(n => this.files[n] !== null).length;
  }

  /** All 7 required files must be present. */
  areRequiredFilesSelected(): boolean {
    return this.uploadedRequiredCount() === 7;
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
        'Missing Documents',
        `Please upload all required documents before submitting. (${this.uploadedRequiredCount()}/7 uploaded)`
      );
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      this.showModal('error', 'Not Logged In', 'You are not logged in. Please log in and try again.');
      return;
    }

    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });

    const formData = new FormData();
    formData.append('document_type',    this.documentType);
    formData.append('Groom_First_Name',  this.documentForm.value.Groom_First_Name);
    formData.append('Groom_Middle_Name', this.documentForm.value.Groom_Middle_Name);
    formData.append('Groom_Last_Name',   this.documentForm.value.Groom_Last_Name);
    formData.append('Groom_DOB',         this.documentForm.value.Groom_DOB);
    formData.append('Bride_First_Name',  this.documentForm.value.Bride_First_Name);
    formData.append('Bride_Middle_Name', this.documentForm.value.Bride_Middle_Name);
    formData.append('Bride_Last_Name',   this.documentForm.value.Bride_Last_Name);
    formData.append('Bride_DOB',         this.documentForm.value.Bride_DOB);

    // Append all uploaded files (required + any optional ones provided)
    const fileLabels: { [key: number]: string } = {
      1:  'valid_id_groom',
      2:  'valid_id_bride',
      3:  'birth_cert_groom',
      4:  'birth_cert_bride',
      5:  'cenomar_groom',
      6:  'cenomar_bride',
      7:  'seminar_certificate',
      8:  'parental_consent',
      9:  'annulment_or_death_cert',
      10: 'legal_capacity_cert',
    };

    for (const num of Object.keys(this.files).map(Number)) {
      const file = this.files[num];
      if (file) {
        formData.append('files', file, `${fileLabels[num]}_${file.name}`);
      }
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
        this.files = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null };

        this.showModal(
          'success',
          'Request Submitted!',
          'Your Marriage License application has been successfully submitted.',
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
    this.files = { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null, 7: null, 8: null, 9: null, 10: null };
    this.documentForm.reset();
  }
}
