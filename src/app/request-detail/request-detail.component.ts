import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './request-detail.component.html',
  styleUrls: ['./request-detail.component.css']
})
export class RequestDetailComponent implements OnInit {
  requestId!: number;
  request: any;
  loading = true;
  errorMessage = '';

  // Modal controls
  showDenyModal = false;

  // Denial reasons with checkboxes
  denialOptions = [
    { key: 'blurry', label: 'Blurry', details: '', selected: false },
    { key: 'incomplete', label: 'Incomplete', details: '', selected: false },
    { key: 'unauthorized', label: 'Unauthorized', details: '', selected: false },
    { key: 'other', label: 'Other', details: '', selected: false }
  ];

  backendUrl = 'https://drtbackend-2cw3.onrender.com';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.requestId = +this.route.snapshot.paramMap.get('id')!;
    this.fetchRequestDetail();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('You are not logged in!');
      throw new Error('Unauthorized');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  fetchRequestDetail() {
  this.loading = true;
  const token = localStorage.getItem('token');

  this.http.get<any>(`${this.backendUrl}/api/document_request/${this.requestId}`, {
    headers: { Authorization: `Bearer ${token}` }
  }).subscribe({
    next: (data) => {
      this.request = data;

      // 🔥 IMPORTANT: split multiple files
      if (this.request?.file_path) {
        this.request.fileUrls = this.request.file_path
          .split(',')
          .map((p: string) => `${this.backendUrl}/${p.trim()}`);
      } else {
        this.request.fileUrls = [];
      }

      this.loading = false;
    },
    error: (err) => {
      console.error('Failed to load document request:', err);
      this.errorMessage = 'Failed to load document request.';
      this.loading = false;
    }
  });
}

  processRequest() {
  let headers: HttpHeaders;
  try { headers = this.getAuthHeaders(); } catch { return; }

  let endpoint = '';
  let successMessage = '';

  if (this.request.status === 'pending') {
    endpoint = `${this.backendUrl}/api/document_request/${this.requestId}/process`;
    successMessage = 'Request is now In Process';
  } else if (this.request.status === 'in_process') {
    endpoint = `${this.backendUrl}/api/document_request/${this.requestId}/approved`;
    successMessage = 'Request has been Approved';
  } else {
    console.warn('Cannot process this request:', this.request.status);
    return;
  }

  this.http.post(endpoint, {}, { headers }).subscribe({
    next: async () => {
      console.log(successMessage);

      // Wait a short moment to ensure backend data has updated
      await new Promise(r => setTimeout(r, 100));

      // Refresh local data if needed
      this.fetchRequestDetail();

      // Then navigate back to home-staff
      this.router.navigate(['/home-staff']).then(success => {
        if (!success) console.warn('Navigation failed');
      });
    },
    error: (err) => console.error('Failed to update request status:', err)
  });
}


  // Show modal to select reasons
denyRequest() {
  this.showDenyModal = true;
  this.denialOptions.forEach(opt => opt.details = '');
}

// Toggle checkbox selection
toggleReason(event: any, option: any) {
  option.selected = event.target.checked;
}

// Confirm deny: send to backend and navigate to home-staff
confirmDeny() {
  const selected = this.denialOptions.filter(opt => opt.selected);
  if (selected.length === 0) {
    console.error('Please select at least one reason.');
    return;
  }

  const reasonStrings = selected.map(opt => `${opt.label}${opt.details ? `: ${opt.details}` : ''}`);
  const finalReason = reasonStrings.join('; ');

  let headers: HttpHeaders;
  try { headers = this.getAuthHeaders(); } catch { return; }

  this.http.put(
    `${this.backendUrl}/api/document_request/${this.requestId}/deny`, // unified endpoint
    { reason: finalReason },
    { headers }
  ).subscribe({
    next: () => {
      console.log('Request denied successfully');
      this.showDenyModal = false;
      this.denialOptions.forEach(opt => opt.selected = false);

      // Navigate back automatically
      this.router.navigate(['/home-staff']).then(success => {
        if (!success) console.warn('Navigation failed');
      });
    },
    error: (err) => console.error('Failed to deny request:', err)
  });
}

// Cancel modal
cancelDeny() {
  this.showDenyModal = false;
  this.denialOptions.forEach(opt => opt.selected = false);
}

}
