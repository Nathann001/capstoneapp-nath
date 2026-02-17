import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-process-request',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './process-request.component.html',
  styleUrls: ['./process-request.component.css']
})
export class ProcessRequestComponent implements OnInit {
  requestId!: number;
  request: any;
  documentType: string = '';
  loading = true;
  errorMessage = '';
  showDenyModal = false;

  // Lightbox
  lightboxImage: string | null = null;

  // Confirmation modal
  modal: {
    visible: boolean;
    type: 'success' | 'error' | 'warning';
    title: string;
    message: string;
  } = {
    visible: false,
    type: 'success',
    title: '',
    message: ''
  };

  denialOptions = [
    { key: 'blurry',       label: 'Blurry',        details: '', selected: false },
    { key: 'incomplete',   label: 'Incomplete',     details: '', selected: false },
    { key: 'unauthorized', label: 'Unauthorized',   details: '', selected: false },
    { key: 'other',        label: 'Other',          details: '', selected: false }
  ];

  backendUrl = 'https://drtbackend-2cw3.onrender.com';

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.requestId = +this.route.snapshot.paramMap.get('id')!;
    this.fetchRequestDetail();
    this.fetchDocumentType();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('You are not logged in!');
      throw new Error('Unauthorized');
    }
    return new HttpHeaders({ Authorization: 'Bearer ' + token });
  }

  fetchRequestDetail() {
    this.loading = true;
    const headers = this.getAuthHeaders();

    this.http.get<any>(this.backendUrl + '/api/document_request/' + this.requestId, { headers })
      .subscribe({
        next: (data) => {
          this.request = data;

          if (this.request?.file_path) {
            this.request.fileUrls = this.request.file_path
              .split(',')
              .map((p: string) => {
                const trimmed = p.trim();
                if (trimmed.startsWith('http')) return trimmed;
                return this.backendUrl + '/' + trimmed;
              });
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

  // Fetch document_type from document_request table
  fetchDocumentType() {
    const token = localStorage.getItem('token');

    this.http.get<any[]>(`${this.backendUrl}/api/document_request`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        const match = data.find((r: any) => r.RequestID === this.requestId || r.id === this.requestId);
        if (match) {
          this.documentType = match.document_type || '—';
        }
      },
      error: (err) => {
        console.error('Failed to fetch document type:', err);
      }
    });
  }

  // Lightbox controls
  openLightbox(imageUrl: string) {
    this.lightboxImage = imageUrl;
  }

  closeLightbox() {
    this.lightboxImage = null;
  }

  // Modal controls
  showModal(type: 'success' | 'error' | 'warning', title: string, message: string) {
    this.modal = { visible: true, type, title, message };
  }

  closeModal() {
    const wasSuccess = this.modal.type === 'success';
    this.modal.visible = false;
    if (wasSuccess) {
      this.router.navigate(['/home-staff']);
    }
  }

  approveRequest() {
    let headers: HttpHeaders;
    try { headers = this.getAuthHeaders(); } catch { return; }

    this.http.post(this.backendUrl + '/api/document_request/' + this.requestId + '/approved', {}, { headers })
      .subscribe({
        next: () => {
          this.showModal('success', 'Request Approved', 'The request has been approved successfully.');
        },
        error: (err) => {
          console.error('Failed to approve request:', err);
          this.showModal('error', 'Approval Failed', 'Failed to approve the request. Please try again.');
        }
      });
  }

  denyRequest() {
    this.showDenyModal = true;
    this.denialOptions.forEach(opt => {
      opt.details = '';
      opt.selected = false;
    });
  }

  toggleReason(event: any, option: any) {
    option.selected = event.target.checked;
  }

  confirmDeny() {
    const selected = this.denialOptions.filter(opt => opt.selected);
    if (selected.length === 0) {
      this.showModal('warning', 'No Reason Selected', 'Please select at least one reason for denial.');
      return;
    }

    const reasonStrings = selected.map(opt => opt.label + (opt.details ? ': ' + opt.details : ''));
    const finalReason = reasonStrings.join('; ');

    let headers: HttpHeaders;
    try { headers = this.getAuthHeaders(); } catch { return; }

    this.http.put(
      this.backendUrl + '/api/document_request/' + this.requestId + '/deny',
      { reason: finalReason },
      { headers }
    ).subscribe({
      next: () => {
        this.showDenyModal = false;
        this.denialOptions.forEach(opt => opt.selected = false);
        this.showModal('success', 'Request Denied', 'The request has been denied successfully.');
      },
      error: (err) => {
        console.error('Failed to deny request:', err);
        this.showModal('error', 'Denial Failed', 'Failed to deny the request. Please try again.');
      }
    });
  }

  cancelDeny() {
    this.showDenyModal = false;
    this.denialOptions.forEach(opt => opt.selected = false);
  }

  isImageUrl(url: string): boolean {
    return /\.(png|jpe?g)$/i.test(url);
  }

  isPdfUrl(url: string): boolean {
    return url.endsWith('.pdf');
  }
}