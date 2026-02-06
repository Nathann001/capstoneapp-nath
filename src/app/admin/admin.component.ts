import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.css']
})
export class AdminComponent implements OnInit {
  archiveCount: number = 0;
  // Arrays for different statuses
  documentRequests: any[] = [];
  inProcess: any[] = [];
  processed: any[] = [];
  denied: any[] = [];

  // ---------- STATISTICS ----------
  stats = {
    processed: { today: 0, week: 0, month: 0 },
    denied: { today: 0, week: 0, month: 0 }
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadRequests();
  }

  // ---------- LOAD REQUESTS ----------
loadRequests() {
  const token = localStorage.getItem('token'); // get JWT from storage
  if (!token) {
    console.error('No token found. Please log in.');
    return;
  }

  this.http.get<any[]>('http://localhost:4000/api/admin/document_request', {
  headers: { Authorization: `Bearer ${token}` }
}).subscribe({
    next: (data) => {
      console.log('Raw API data:', data);

      // Only include active (archived = 0)
      const activeData = data.filter(d => d.archived === 0);

      // Split by status
      this.documentRequests = activeData.filter(d => d.status === 'requested');
      this.inProcess = activeData.filter(d => d.status === 'in_process');
      this.processed = activeData.filter(d => d.status === 'processed');
      this.denied = activeData.filter(d => d.status === 'denied');

      // Calculate stats separately for Processed and Denied
      this.calculateStats(data); // optionally include archived for stats
    },
    error: (err) => console.error('Failed to fetch document requests', err)
  });
}



  // ---------- ARCHIVE REQUEST ----------
  archiveRequest(id: number) {
    const token = localStorage.getItem('token'); // get JWT from storage
    if (!token) {
      console.error('No token found. Please log in.');
      return;
    }

    this.http.put(`http://localhost:4000/api/document_request/${id}/archive`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (res) => {
        console.log('Archived:', res);
        // Refresh the list after archiving
        this.loadRequests();
      },
      error: (err) => console.error('Archive failed:', err)
    });
  }

calculateStats(data: any[]) {
  const now = new Date();

  // Processed requests (include archived)
  const processedData = data.filter(d => d.status === 'processed' || d.status === 'archived');
  const deniedData = data.filter(d => d.status === 'denied');

  this.stats.processed.today = processedData.filter(d =>
    this.isSameDay(new Date(d.updated_at || d.date_created), now)
  ).length;

  this.stats.processed.week = processedData.filter(d =>
    this.isSameWeek(new Date(d.updated_at || d.date_created), now)
  ).length;

  this.stats.processed.month = processedData.filter(d =>
    this.isSameMonth(new Date(d.updated_at || d.date_created), now)
  ).length;

  this.stats.denied.today = deniedData.filter(d =>
    this.isSameDay(new Date(d.updated_at || d.date_created), now)
  ).length;

  this.stats.denied.week = deniedData.filter(d =>
    this.isSameWeek(new Date(d.updated_at || d.date_created), now)
  ).length;

  this.stats.denied.month = deniedData.filter(d =>
    this.isSameMonth(new Date(d.updated_at || d.date_created), now)
  ).length;
}


  // ---------- HELPER FUNCTIONS ----------
  isSameDay(a: Date, b: Date) {
    return a.toDateString() === b.toDateString();
  }

  isSameWeek(a: Date, b: Date) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.abs(a.getTime() - b.getTime()) / oneDay < 7;
  }

  isSameMonth(a: Date, b: Date) {
    return a.getMonth() === b.getMonth() &&
           a.getFullYear() === b.getFullYear();
  }

  // ---------- NAVIGATION / DETAILS ----------
  viewRequestDetail(request: any) {
    console.log('View requested detail for', request.RequestID);
  }

  viewInProcessDetail(request: any) {
    console.log('View in-process detail for', request.RequestID);
  }
}
