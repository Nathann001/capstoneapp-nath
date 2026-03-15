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
  pending:      any[] = [];
  under_review: any[] = [];
  approved:     any[] = [];
  denied:       any[] = [];
  for_release:  any[] = [];
  released:     any[] = [];
  showProfileModal = false;

  stats: Record<string, { today: number; week: number; month: number }> = {
    approved:     { today: 0, week: 0, month: 0 },
    denied:       { today: 0, week: 0, month: 0 },
    pending:      { today: 0, week: 0, month: 0 },
    under_review: { today: 0, week: 0, month: 0 },
    for_release:  { today: 0, week: 0, month: 0 },
    released:     { today: 0, week: 0, month: 0 }
  };

  selectedRow1: 'approved' | 'denied' | 'pending' | 'under_review' | 'for_release' | 'released' = 'approved';
  selectedRow2: 'approved' | 'denied' | 'pending' | 'under_review' | 'for_release' | 'released' = 'pending';

  // ── Per-table pagination ──────────────────────────────────
  itemsPerPage          = 5;
  currentPagePending    = 1;
  currentPageReview     = 1;
  currentPageApproved   = 1;
  currentPageDenied     = 1;
  currentPageForRelease = 1;
  currentPageReleased   = 1;
  currentPageAppts      = 1;

  // ── Appointments ──────────────────────────────────────────
  appointments:       any[] = [];
  isLoadingAppts      = false;
  apptFilterDate      = '';
  apptFilterStatus    = '';
  apptFilterCertType  = '';
  apptFilterRegType   = '';

  // ── Modals ────────────────────────────────────────────────
  showConfirmModal    = false;
  confirmModalTitle   = '';
  confirmModalMessage = '';
  pendingAction: (() => void) | null = null;

  showResultModal     = false;
  resultModalType: 'success' | 'error' = 'success';
  resultModalMessage  = '';

  private API = 'https://drtbackend-2cw3.onrender.com/api/document_request';

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.checkStaffProfile();
    this.fetchDocumentRequests();
    this.fetchForReleaseRequests();
    this.fetchReleasedRequests();
    this.fetchAppointments();
  }

  // ── Staff name resolver ───────────────────────────────────
  getStaffName(doc: any): string | null {
    return doc.assigned_staff_name
      || doc.staff_name
      || doc.assignedStaff
      || doc.assigned_staff
      || doc.staffName
      || doc.staff_full_name
      || null;
  }

  // ── Pagination helpers ────────────────────────────────────
  getPaginatedItems(list: any[], currentPage: number): any[] {
    const start = (currentPage - 1) * this.itemsPerPage;
    return list.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(list: any[]): number[] {
    return Array(Math.ceil(list.length / this.itemsPerPage))
      .fill(0).map((_, i) => i + 1);
  }

  // ── Modal helpers ─────────────────────────────────────────
  openConfirm(title: string, message: string, action: () => void) {
    this.confirmModalTitle   = title;
    this.confirmModalMessage = message;
    this.pendingAction       = action;
    this.showConfirmModal    = true;
  }

  confirmModalAction() {
    this.showConfirmModal = false;
    if (this.pendingAction) { this.pendingAction(); this.pendingAction = null; }
  }

  cancelModal() {
    this.showConfirmModal = false;
    this.pendingAction = null;
  }

  showResult(type: 'success' | 'error', message: string) {
    this.resultModalType    = type;
    this.resultModalMessage = message;
    this.showResultModal    = true;
  }

  closeResultModal() { this.showResultModal = false; }

  // ── Data loaders ──────────────────────────────────────────
  fetchDocumentRequests() {
    const token = localStorage.getItem('token');
    if (!token) return console.error('No token found.');

    this.http.get<any[]>(this.API, { headers: { Authorization: `Bearer ${token}` } }).subscribe({
      next: (data) => {
        const active = data.filter(d => d.archived === 0);
        const asc = (a: any, b: any) =>
          new Date(a.updated_at || a.date_created).getTime() -
          new Date(b.updated_at || b.date_created).getTime();

        this.pending      = active.filter(d => d.status === 'pending').sort(asc);
        this.under_review = active.filter(d => d.status === 'under_review').sort(asc);
        this.approved     = active.filter(d => d.status === 'approved').sort(asc);
        this.denied       = active.filter(d => d.status === 'denied').sort(asc);

        // ✅ Recalculate stats after all data is loaded
        this.recalculateStats();
      },
      error: (err) => console.error('Failed to fetch document requests', err)
    });
  }

  fetchForReleaseRequests() {
    const token = localStorage.getItem('token') || '';
    this.http.get<any[]>(`${this.API}/for_release`, { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next: (data) => {
          this.for_release = data;
          this.recalculateStats();
        },
        error: (err) => console.error('Failed to fetch For Release requests', err)
      });
  }

  fetchReleasedRequests() {
    const token = localStorage.getItem('token') || '';
    this.http.get<any[]>(`${this.API}/released_list`, { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next: (data) => {
          this.released = data;
          this.recalculateStats();
        },
        error: (err) => console.error('Failed to fetch Released requests', err)
      });
  }

  // ── Actions ───────────────────────────────────────────────
  markForRelease(requestId: number) {
    this.openConfirm(
      'Mark as For Release',
      'Are you sure you want to mark this request as For Release?',
      () => {
        const token = localStorage.getItem('token') || '';
        this.http.put(`${this.API}/${requestId}/for_release`, {}, { headers: { Authorization: `Bearer ${token}` } })
          .subscribe({
            next: (res: any) => {
              this.approved = this.approved.filter(d => d.RequestID !== requestId);
              this.fetchForReleaseRequests();
              this.showResult('success', res.message || 'Marked as For Release.');
            },
            error: (err) => this.showResult('error', err.error?.message || 'Failed to mark as For Release.')
          });
      }
    );
  }

  markAsReleased(requestId: number) {
    this.openConfirm(
      'Mark as Released',
      'Are you sure you want to mark this request as Released?',
      () => {
        const token = localStorage.getItem('token') || '';
        this.http.put(`${this.API}/${requestId}/released`, {}, { headers: { Authorization: `Bearer ${token}` } })
          .subscribe({
            next: (res: any) => {
              this.for_release = this.for_release.filter(d => d.RequestID !== requestId);
              this.fetchReleasedRequests();
              this.showResult('success', res.message || 'Marked as Released.');
            },
            error: (err) => this.showResult('error', err.error?.message || 'Failed to mark as Released.')
          });
      }
    );
  }

  // ── Appointments ──────────────────────────────────────────
  fetchAppointments() {
    this.isLoadingAppts   = true;
    this.currentPageAppts = 1;
    const token = localStorage.getItem('token') || '';
    const params: string[] = [];
    if (this.apptFilterDate)     params.push(`date=${this.apptFilterDate}`);
    if (this.apptFilterStatus)   params.push(`status=${this.apptFilterStatus}`);
    if (this.apptFilterCertType) params.push(`certificate_type=${this.apptFilterCertType}`);
    if (this.apptFilterRegType)  params.push(`registration_type=${encodeURIComponent(this.apptFilterRegType)}`);

    const url = 'https://drtbackend-2cw3.onrender.com/api/staff/appointments' +
                (params.length ? '?' + params.join('&') : '');

    this.http.get<any[]>(url, { headers: { Authorization: `Bearer ${token}` } })
      .subscribe({
        next:  (data) => { this.appointments = data; this.isLoadingAppts = false; },
        error: (err)  => { console.error('Failed to fetch appointments', err); this.isLoadingAppts = false; }
      });
  }

  clearApptFilters() {
    this.apptFilterDate     = '';
    this.apptFilterStatus   = '';
    this.apptFilterCertType = '';
    this.apptFilterRegType  = '';
    this.fetchAppointments();
  }

  formatApptTime(t: string): string {
    if (!t) return '—';
    const [h, m] = t.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour   = h % 12 || 12;
    return `${hour}:${String(m).padStart(2, '0')} ${period}`;
  }

  // ── Stats ─────────────────────────────────────────────────

  // ✅ Recalculates stats from actual loaded arrays (includes for_release & released)
  recalculateStats() {
    const now = new Date();

    const countArr = (arr: any[], fn: (d: Date) => boolean) =>
      arr.filter(d => fn(new Date(d.updated_at || d.date_created))).length;

    const statusMap: { key: string; arr: any[] }[] = [
      { key: 'pending',      arr: this.pending },
      { key: 'under_review', arr: this.under_review },
      { key: 'approved',     arr: this.approved },
      { key: 'denied',       arr: this.denied },
      { key: 'for_release',  arr: this.for_release },
      { key: 'released',     arr: this.released }
    ];

    for (const { key, arr } of statusMap) {
      this.stats[key].today = countArr(arr, d => this.isSameDay(d, now));
      this.stats[key].week  = countArr(arr, d => this.isSameWeek(d, now));
      this.stats[key].month = countArr(arr, d => this.isSameMonth(d, now));
    }
  }

  isSameDay(a: Date, b: Date)   { return a.toDateString() === b.toDateString(); }
  isSameWeek(a: Date, b: Date)  { return Math.abs(a.getTime() - b.getTime()) / (24*60*60*1000) < 7; }
  isSameMonth(a: Date, b: Date) { return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); }

  formatStatName(name: string): string {
    const labels: Record<string, string> = {
      under_review: 'Under Review',
      for_release:  'For Release',
      released:     'Released',
      approved:     'Approved',
      denied:       'Denied',
      pending:      'Pending'
    };
    return labels[name] || name;
  }

  getDocumentLabel(type: string): string {
    const map: Record<string, string> = {
      birth:    'Birth Certificate',
      death:    'Death Certificate',
      marriage: 'Marriage Certificate'
    };
    return map[type] || type;
  }

  checkStaffProfile(): void {
  const storedUser = localStorage.getItem('user');
  if (!storedUser) return;
  const user = JSON.parse(storedUser);
  if (user.role === 2 && !user.detailsCompleted) {
    this.showProfileModal = true;
  }
}

closeProfileModal(): void {
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    const user = JSON.parse(storedUser);
    if (user.detailsCompleted) {
      this.showProfileModal = false;
    }
  }
}

goToProfile(): void {
  this.router.navigate(['/account']);
}

  viewRequestDetail(request: any)   { this.router.navigate(['/request-detail',  request.RequestID]); }
  viewInProcessDetail(request: any) { this.router.navigate(['/process-request', request.RequestID]); }
}
