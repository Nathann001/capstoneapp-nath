import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';

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

  // Define the 3 documents (only #3 Birth Certificate is required)
  fileRequirements = [
    { number: 1, label: 'Affidavit of Admission of Paternity', hint: 'Affidavit of Acknowledgment/Admission of Paternity', required: false },
    { number: 2, label: 'Affidavit to Use the Surname of the Father', hint: 'Affidavit to Use the Surname of the Father', required: false },
    { number: 3, label: 'Birth Certificate', hint: 'Upload a copy of the duly accomplished birth certificate', required: true }
  ];

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.documentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  documentType = 'Birth Certificate';

  get f() {
    return this.documentForm.controls;
  }

  onFileSelected(event: any, fileNumber: number) {
    if (event.target.files.length > 0) {
      this.files[fileNumber] = event.target.files[0];
    }
  }

  // Check if all REQUIRED files are uploaded (only file #3)
  areRequiredFilesSelected(): boolean {
    return this.files[3] !== null; // Only birth certificate (#3) is required
  }

  // Get file name for display
  getFileName(fileNumber: number): string {
    return this.files[fileNumber]?.name || 'No file selected';
  }

  submitDocumentRequest() {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    // Check if birth certificate (file #3) is uploaded
    if (!this.areRequiredFilesSelected()) {
      alert('Please upload the birth certificate (required document)');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      alert('You are not logged in!');
      return;
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    const formData = new FormData();
    formData.append('name', this.documentForm.value.name);
    formData.append('document_type', this.documentType);

    // Append all files (optional ones are skipped if not selected)
    for (let i = 1; i <= 3; i++) {
      if (this.files[i]) {
        formData.append('files', this.files[i]!, this.files[i]!.name);
      }
    }

    this.http.post('https://drtbackend-2cw3.onrender.com/api/document_request', formData, { headers })
      .subscribe({
        next: (res: any) => {
          alert('Document request submitted successfully! Request ID: ' + res.requestId);
          this.documentForm.reset();
          this.files = { 1: null, 2: null, 3: null };
        },
        error: (err: any) => {
          if (err.status === 401) {
            alert('Unauthorized! Please log in again.');
          } else {
            alert('Failed to submit document request. Error: ' + (err.error?.message || err.message));
          }
        }
      });
  }

  // Reset all files
  resetFiles() {
    this.files = { 1: null, 2: null, 3: null };
    this.documentForm.reset();
  }
}
