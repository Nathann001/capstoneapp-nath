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
  // ---------- DATA ----------
  documentRequests: any[] = [];
  inProcess: any[] = [];
  approved: any[] = [];
  denied: any[] = [];
  rows: (1 | 2)[] = [1, 2];


  // ---------- STATS ----------
  stats = {
    approved: { today: 0, week: 0, month: 0 },
    denied: { today: 0, week: 0, month: 0 },
    pending: { today: 0, week: 0, month: 0 },
    under_review: { today: 0, week: 0, month: 0 }
  };

  // ---------- CURRENT SELECTION ----------
  selectedRow1: 'approved' | 'denied' | 'pending' | 'under_review' = 'approved';
  selectedRow2: 'approved' | 'denied' | 'pending' | 'under_review' = 'denied';

  // ---------- PAGINATION ----------
  itemsPerPage = 6;
  currentPage1 = 1;
  currentPage2 = 1;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadRequests();
  }

  // ---------- FETCH DATA ----------
  loadRequests() {
    const token = localStorage.getItem('token');
    if (!token) return console.error('No token found. Please log in.');

    this.http.get<any[]>('http://localhost:4000/api/admin/document_request', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        const activeData = data.filter(d => d.archived === 0);

        this.documentRequests = activeData.filter(d => d.status === 'pending');
        this.inProcess = activeData.filter(d => d.status === 'under_review');
        this.approved = activeData.filter(d => d.status === 'approved');
        this.denied = activeData.filter(d => d.status === 'denied');

        this.calculateStats(data);
      },
      error: (err) => console.error('Failed to fetch document requests', err)
    });
  }

  // ---------- HELPER FUNCTIONS ----------
  getTableForRow(row: 1 | 2) {
    const category = row === 1 ? this.selectedRow1 : this.selectedRow2;
    switch (category) {
      case 'approved': return this.approved;
      case 'denied': return this.denied;
      case 'pending': return this.documentRequests;
      case 'under_review': return this.inProcess;
      default: return [];
    }
  }

  getPaginatedItems(row: 1 | 2) {
    const list = this.getTableForRow(row);
    const currentPage = row === 1 ? this.currentPage1 : this.currentPage2;
    const start = (currentPage - 1) * this.itemsPerPage;
    return list.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(row: 1 | 2) {
    const list = this.getTableForRow(row);
    return Array(Math.ceil(list.length / this.itemsPerPage)).fill(0).map((_, i) => i + 1);
  }

  changePage(row: 1 | 2, page: number) {
    if (row === 1) this.currentPage1 = page;
    else this.currentPage2 = page;
  }

  // ---------- NAVIGATION ----------
  viewRequestDetail(doc: any) {
    console.log('View Request Detail', doc);
  }

  viewInProcessDetail(doc: any) {
    console.log('View In Process Detail', doc);
  }

  // ---------- STATS ----------
  calculateStats(data: any[]) {
    const now = new Date();
    const countByPeriod = (arr: any[], fn: (d: Date) => boolean) =>
      arr.filter(d => fn(new Date(d.updated_at || d.date_created))).length;

    const filterStatus = (status: string) => data.filter(d => d.status === status);

    for (const status of ['approved', 'denied', 'pending', 'under_review'] as const) {
      const arr = filterStatus(status);
      this.stats[status].today = countByPeriod(arr, d => this.isSameDay(d, now));
      this.stats[status].week = countByPeriod(arr, d => this.isSameWeek(d, now));
      this.stats[status].month = countByPeriod(arr, d => this.isSameMonth(d, now));
    }
  }

  archiveRequest(doc: any, event: Event) {
  event.stopPropagation(); // Prevent row click

  if (!confirm(`Are you sure you want to archive "${doc.name}"?`)) return;

  const token = localStorage.getItem('token');
  if (!token) return console.error('No token found. Please log in.');

  this.http.put(`http://localhost:4000/api/document_request/${doc.RequestID}/archive`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  }).subscribe({
    next: (res: any) => {
      console.log(res.message || 'Archived successfully!');
      doc.archived = 1;

      // Remove from current table
      this.documentRequests = this.documentRequests.filter(d => d.RequestID !== doc.RequestID);
      this.inProcess = this.inProcess.filter(d => d.RequestID !== doc.RequestID);
      this.approved = this.approved.filter(d => d.RequestID !== doc.RequestID);
      this.denied = this.denied.filter(d => d.RequestID !== doc.RequestID);
    },
    error: (err) => {
      console.error('Failed to archive request', err);
    }
  });
}

  isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
  isSameWeek(a: Date, b: Date) { return Math.abs(a.getTime() - b.getTime()) / (24*60*60*1000) < 7; }
  isSameMonth(a: Date, b: Date) { return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); }
  formatStatName(name: string) { return name === 'under_review' ? 'Under Review' : name.charAt(0).toUpperCase() + name.slice(1); }
}
