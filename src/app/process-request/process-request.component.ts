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
      alert('You are not logged in!');
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
          console.error(err);
          this.errorMessage = 'Failed to load document request.';
          this.loading = false;
        }
      });
  }

  approveRequest() {
    let headers: HttpHeaders;
    try { headers = this.getAuthHeaders(); } catch { return; }

    this.http.post(`${this.backendUrl}/api/document_request/${this.requestId}/processed`, {}, { headers })
      .subscribe({
        next: () => alert('Request marked as In Process'),
        error: (err) => {
          console.error(err);
          alert(err.status === 401 ? 'Unauthorized' : 'Failed to process request');
        }
      });
  }

  denyRequest() {
    let headers: HttpHeaders;
    try { headers = this.getAuthHeaders(); } catch { return; }

    // PUT request to update status to denied
    this.http.put(`${this.backendUrl}/api/document_request/${this.requestId}`, { status: 'denied' }, { headers })
      .subscribe({
        next: () => {
          alert('Request marked as Denied');
          this.router.navigate(['/home-staff']).then(() => window.location.reload());
        },
        error: (err) => {
          console.error(err);
          alert(err.status === 401 ? 'Unauthorized' : 'Failed to update request status');
        }
      });
  }
}
