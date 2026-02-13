import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-process-request',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './process-request.component.html',
  styleUrls: ['./process-request.component.css']
})
export class ProcessRequestComponent implements OnInit {
  requestId!: number;
  request: any;
  loading = true;
  errorMessage = '';

  backendUrl = 'http://localhost:4000'; // your backend URL

  constructor(private route: ActivatedRoute, private router: Router, private http: HttpClient) {}

  ngOnInit() {
    this.requestId = +this.route.snapshot.paramMap.get('id')!;
    this.fetchRequestDetail();
  }

  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('You are not logged in!');
      throw new Error('Unauthorized');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  fetchRequestDetail() {
    this.loading = true;
    const headers = this.getAuthHeaders();

    this.http.get<any>(`${this.backendUrl}/api/document_request/${this.requestId}`, { headers })
      .subscribe({
        next: (data) => {
          this.request = data;
          if (this.request?.file_path) {
            this.request.fullFileUrl = `${this.backendUrl}/${this.request.file_path}`;
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

  approveRequest() {
    let headers: HttpHeaders;
    try { headers = this.getAuthHeaders(); } catch { return; }

    this.http.post(`${this.backendUrl}/api/document_request/${this.requestId}/approved`, {}, { headers })
      .subscribe({
        next: () => console.log('Request marked as In Process'),
        error: (err) => {
          console.error('Failed to approve request:', err);
        }
      });
  }

  denyRequest(reason?: string) {
    if (!reason || !reason.trim()) {
      console.error('Denial reason is required');
      return;
    }

    const headers = this.getAuthHeaders();

    this.http.put(
      `${this.backendUrl}/api/document_request/${this.requestId}/deny`,
      { reason },
      { headers }
    ).subscribe({
      next: () => {
        console.log('Request denied and email sent');
        this.router.navigate(['/home-staff']).then(() => location.reload());
      },
      error: (err) => {
        console.error('Failed to deny request:', err);
      }
    });
  }
}
