import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-emp-year',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './emp-year.component.html',
  styleUrls: ['./emp-year.component.css']
})
export class EmpYearComponent {
  documentForm: FormGroup;
  selectedFile: File | null = null;

  constructor(private fb: FormBuilder, private http: HttpClient) {
    this.documentForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(50)]]
    });
  }

  // Getter for easy access to form controls
  get f() {
    return this.documentForm.controls;
  }

  // Handle file selection
  onFileSelected(event: any) {
    if (event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
    }
  }

  // Submit name + file
  submitDocumentRequest() {
    if (this.documentForm.invalid) {
      this.documentForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('name', this.documentForm.value.name);
    if (this.selectedFile) {
    formData.append('file', this.selectedFile, this.selectedFile.name);
    }
    this.http.post('http://localhost:4000/api/document_request', formData)
    .subscribe({
    next: () => alert('Document request submitted successfully!'),
    error: err => alert('Failed to submit document request. Error: ' + err.message)
  });
  }
}
