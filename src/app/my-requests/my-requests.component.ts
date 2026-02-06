import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service'; // Use your AuthService

@Component({
  selector: 'app-my-requests',
  standalone: true,
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css'],
  imports: [CommonModule]
})
export class MyRequestsComponent implements OnInit {
  requests: any[] = [];
  historyMap: { [key: number]: any[] } = {};

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.fetchRequests();
  }

  // Fetch all requests
  fetchRequests() {
    this.authService.getMyRequests().subscribe({
      next: (res) => this.requests = res,
      error: (err) => console.error('Failed to fetch requests', err)
    });
  }

  // Fetch history of a specific request
  viewHistory(requestId: number) {
    if (this.historyMap[requestId]) return;

    this.authService.getRequestHistory(requestId).subscribe({
      next: (res) => this.historyMap[requestId] = res,
      error: (err) => console.error('Failed to fetch history', err)
    });
  }

  // Download file for a specific request
  downloadFile(requestId: number, filePath: string) {
    this.authService.downloadRequestFile(requestId).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filePath.split('/').pop() || 'file';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      },
      error: (err) => console.error('Failed to download file', err)
    });
  }
}
