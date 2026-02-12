import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-home-staff',
  standalone: true,
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './home-staff.component.html',
  styleUrls: ['./home-staff.component.css']
})
export class HomeStaffComponent implements OnInit {
  pending: any[] = [];
  under_review: any[] = [];
  approved: any[] = [];
  denied: any[] = [];

  // ---------- STATISTICS ----------
  stats = {
    approved: { today: 0, week: 0, month: 0 },
    denied: { today: 0, week: 0, month: 0 },
    pending: { today: 0, week: 0, month: 0 },
    under_review: { today: 0, week: 0, month: 0 }
  };

  // ---------- ROW SELECTIONS ----------
  selectedRow1: 'approved' | 'denied' | 'pending' | 'under_review' = 'approved';
  selectedRow2: 'approved' | 'denied' | 'pending' | 'under_review' = 'pending';

  // ---------- PAGINATION ----------
  itemsPerPage: number = 6;      // show 6 items per page
  currentPage1: number = 1;      // pending table
  currentPage2: number = 1;      // under_review table

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.fetchDocumentRequests();
  }

  // ---------- FETCH DATA ----------
  fetchDocumentRequests() {
    const token = localStorage.getItem('token');
    if (!token) return console.error('No token found. User might not be logged in.');

    this.http.get<any[]>('http://localhost:4000/api/document_request', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        const activeData = data.filter(d => d.archived === 0);

        const sortByDateAsc = (a: any, b: any) => {
          const dateA = new Date(a.updated_at || a.date_created).getTime();
          const dateB = new Date(b.updated_at || b.date_created).getTime();
          return dateA - dateB;
        };

        this.pending = activeData.filter(d => d.status === 'pending').sort(sortByDateAsc);
        this.under_review = activeData.filter(d => d.status === 'under_review').sort(sortByDateAsc);
        this.approved = activeData.filter(d => d.status === 'approved').sort(sortByDateAsc);
        this.denied = activeData.filter(d => d.status === 'denied').sort(sortByDateAsc);

        this.calculateStats(data);
      },
      error: (err) => console.error('Failed to fetch document requests', err)
    });
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

  // ---------- HELPER ----------
  isSameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }
  isSameWeek(a: Date, b: Date) { return Math.abs(a.getTime() - b.getTime()) / (24*60*60*1000) < 7; }
  isSameMonth(a: Date, b: Date) { return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); }

  formatStatName(name: string) {
    if (name === 'under_review') return 'Under Review';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // ---------- NAVIGATION ----------
  viewRequestDetail(request: any) { this.router.navigate(['/request-detail', request.RequestID]); }
  viewInProcessDetail(request: any) { this.router.navigate(['/process-request', request.RequestID]); }

  // ---------- PAGINATION HELPERS ----------
  getPaginatedItems(list: any[], currentPage: number): any[] {
    const start = (currentPage - 1) * this.itemsPerPage;
    return list.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(list: any[]): number[] {
    return Array(Math.ceil(list.length / this.itemsPerPage)).fill(0).map((_, i) => i + 1);
  }
}
