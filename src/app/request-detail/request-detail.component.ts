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


  backendUrl = 'http://localhost:4000';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}


  ngOnInit() {
    this.requestId = +this.route.snapshot.paramMap.get('id')!;
    this.fetchRequestDetail();
  }

  private getAuthHeaders() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('You are not logged in!');
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
        if (this.request?.file_path) {
          this.request.fullFileUrl = `${this.backendUrl}/${this.request.file_path}`;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        this.errorMessage = 'Failed to load document request.';
        this.loading = false;
      }
    });
  }

  processRequest() {
  let headers: HttpHeaders;
  try { headers = this.getAuthHeaders(); } catch { return; }

  this.http.post(`${this.backendUrl}/api/document_request/${this.requestId}/process`, {}, { headers })
    .subscribe({
      next: () => {
        alert('Request marked as In Process');
        // Redirect staff back to home-staff
        this.router.navigate(['/home-staff']);
      },
      error: (err) => {
        console.error(err);
        alert(err.status === 401 ? 'Unauthorized' : 'Failed to process request');
      }
    });
}


  denyRequest() {
    this.showDenyModal = true;
    // Reset previous selections
    this.denialOptions.forEach(option => option.details = '');
  }

  toggleReason(event: any, option: any) {
    option.selected = event.target.checked;
  }

  confirmDeny() {
  const selected = this.denialOptions.filter(opt => opt.selected);
  if (selected.length === 0) {
    alert('Please select at least one reason.');
    return;
  }

  const reasonStrings = selected.map(opt => `${opt.label}${opt.details ? `: ${opt.details}` : ''}`);
  const finalReason = reasonStrings.join('; ');

  let headers: HttpHeaders;
  try { headers = this.getAuthHeaders(); } catch { return; }

  this.http.put(`${this.backendUrl}/api/document_request/${this.requestId}`,
    { status: 'denied', reason: finalReason },
    { headers }
  ).subscribe({
    next: () => {
      alert('Request denied successfully');
      this.showDenyModal = false;
      this.denialOptions.forEach(opt => opt.selected = false);
      // Redirect staff back to home-staff
      this.router.navigate(['/home-staff']);
    },
    error: (err) => {
      console.error(err);
      alert(err.status === 401 ? 'Unauthorized' : 'Failed to deny request');
    }
  });
}


  cancelDeny() {
    this.showDenyModal = false;
    this.denialOptions.forEach(opt => opt.selected = false);
  }
}
