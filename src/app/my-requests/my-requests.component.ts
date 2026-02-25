import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-my-requests',
  standalone: true,
  templateUrl: './my-requests.component.html',
  styleUrls: ['./my-requests.component.css'],
  imports: [CommonModule, RouterModule]
})
export class MyRequestsComponent implements OnInit {
  // ---------- DOCUMENT REQUESTS ----------
  requests: any[] = [];
  historyMap: { [key: number]: any[] } = {};
  historyVisibility: { [key: number]: boolean } = {};
  isLoading: boolean = true;
  loadingHistory: { [key: number]: boolean } = {};

  // ---------- APPOINTMENTS ----------
  appointments: any[] = [];
  isLoadingAppointments: boolean = true;

  constructor(private authService: AuthService, private http: HttpClient) {}

  ngOnInit() {
    this.fetchRequests();
    this.fetchAppointments();
  }

  // ========== DOCUMENT REQUESTS ==========
  fetchRequests() {
    this.isLoading = true;
    this.authService.getMyRequests().subscribe({
      next: (res) => { this.requests = res; this.isLoading = false; },
      error: (err) => { console.error('Failed to fetch requests', err); this.isLoading = false; }
    });
  }

  viewHistory(requestId: number) {
    this.historyVisibility[requestId] = !this.historyVisibility[requestId];
    if (this.historyVisibility[requestId] && !this.historyMap[requestId]) {
      this.fetchHistory(requestId);
    }
  }

  private fetchHistory(requestId: number) {
    this.loadingHistory[requestId] = true;
    this.authService.getRequestHistory(requestId).subscribe({
      next: (res) => { this.historyMap[requestId] = res; this.loadingHistory[requestId] = false; },
      error: (err) => { console.error('Failed to fetch history', err); this.loadingHistory[requestId] = false; }
    });
  }

  downloadFile(requestId: number, filePath: string) {
    this.authService.downloadRequestFile(requestId).subscribe({
      next: (blob) => {
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = filePath.split('/').pop() || `request-${requestId}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      },
      error: (err) => console.error('Failed to download file', err)
    });
  }

  isHistoryVisible(requestId: number): boolean  { return this.historyVisibility[requestId] || false; }
  isHistoryLoading(requestId: number): boolean  { return this.loadingHistory[requestId] || false; }

  getDocumentLabel(type: string): string {
    const map: Record<string, string> = {
      birth:    'Birth Certificate',
      death:    'Death Certificate',
      marriage: 'Marriage Certificate'
    };
    return map[type] || type;
  }

  // ========== APPOINTMENTS ==========
  fetchAppointments() {
    this.isLoadingAppointments = true;
    const token = localStorage.getItem('token') || '';
    this.http.get<any[]>('https://drtbackend-2cw3.onrender.com/api/my/appointments', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => { this.appointments = res; this.isLoadingAppointments = false; },
      error: (err) => { console.error('Failed to fetch appointments', err); this.isLoadingAppointments = false; }
    });
  }

  cancelAppointment(id: number) {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    const token = localStorage.getItem('token') || '';
    this.http.delete(`https://drtbackend-2cw3.onrender.com/api/my/appointments/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.appointments = this.appointments.map(a =>
          a.id === id ? { ...a, status: 'cancelled' } : a
        );
      },
      error: (err) => console.error('Failed to cancel appointment', err)
    });
  }

  formatApptTime(t: string): string {
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }
}
