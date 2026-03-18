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

  private readonly API = 'https://drtbackend-2cw3.onrender.com';

  // ── Document request lists ────────────────────────────────
  pending:      any[] = [];
  under_review: any[] = [];
  approved:     any[] = [];
  denied:       any[] = [];
  for_release:  any[] = [];
  released:     any[] = [];
  showProfileModal = false;

  // ── Stats ─────────────────────────────────────────────────
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

  // ── Pagination ────────────────────────────────────────────
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

  // ── Confirm / Result modals ───────────────────────────────
  showConfirmModal    = false;
  confirmModalTitle   = '';
  confirmModalMessage = '';
  pendingAction: (() => void) | null = null;

  showResultModal     = false;
  resultModalType: 'success' | 'error' = 'success';
  resultModalMessage  = '';

  // ── Staff: reschedule single appointment ──────────────────
  staffRescheduleModalVisible  = false;
  staffRescheduleTarget: any   = null;
  staffRescheduleStep: 1 | 2   = 1;
  staffRescheduleDate          = '';
  staffRescheduleTime          = '';
  staffRescheduleSlots: any[]  = [];
  staffRescheduleLoadingSlots  = false;
  staffRescheduleMinDate       = '';
  staffRescheduleDateError     = '';
  isStaffRescheduling          = false;

  // ── Staff: reschedule entire day ──────────────────────────
  rescheduleDayModalVisible    = false;
  rescheduleDayStep: 1 | 2     = 1;
  rescheduleDayFrom            = '';
  rescheduleDayTo              = '';
  rescheduleDayFromError       = '';
  rescheduleDayToError         = '';
  rescheduleDayFromCount: number | null = null;
  isReschedulingDay            = false;

  private get token(): string { return localStorage.getItem('token') || ''; }
  private get authHeaders()   { return { Authorization: `Bearer ${this.token}` }; }

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.staffRescheduleMinDate = new Date().toISOString().split('T')[0];
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

  // ── Confirm modal ─────────────────────────────────────────
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
    this.http.get<any[]>(`${this.API}/api/document_request`, { headers: this.authHeaders })
      .subscribe({
        next: (data) => {
          const active = data.filter(d => d.archived === 0);
          const asc = (a: any, b: any) =>
            new Date(a.updated_at || a.date_created).getTime() -
            new Date(b.updated_at || b.date_created).getTime();

          this.pending      = active.filter(d => d.status === 'pending').sort(asc);
          this.under_review = active.filter(d => d.status === 'under_review').sort(asc);
          this.approved     = active.filter(d => d.status === 'approved').sort(asc);
          this.denied       = active.filter(d => d.status === 'denied').sort(asc);

          this.recalculateStats();
        },
        error: (err) => console.error('Failed to fetch document requests', err)
      });
  }

  fetchForReleaseRequests() {
    this.http.get<any[]>(`${this.API}/api/document_request/for_release`, { headers: this.authHeaders })
      .subscribe({
        next: (data) => { this.for_release = data; this.recalculateStats(); },
        error: (err)  => console.error('Failed to fetch For Release requests', err)
      });
  }

  fetchReleasedRequests() {
    this.http.get<any[]>(`${this.API}/api/document_request/released_list`, { headers: this.authHeaders })
      .subscribe({
        next: (data) => { this.released = data; this.recalculateStats(); },
        error: (err)  => console.error('Failed to fetch Released requests', err)
      });
  }

  // ── Actions ───────────────────────────────────────────────
  markForRelease(requestId: number) {
    this.openConfirm(
      'Mark as For Release',
      'Are you sure you want to mark this request as For Release?',
      () => {
        this.http.put(`${this.API}/api/document_request/${requestId}/for_release`, {}, { headers: this.authHeaders })
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
        this.http.put(`${this.API}/api/document_request/${requestId}/released`, {}, { headers: this.authHeaders })
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
    const params: string[] = [];
    if (this.apptFilterDate)     params.push(`date=${this.apptFilterDate}`);
    if (this.apptFilterStatus)   params.push(`status=${this.apptFilterStatus}`);
    if (this.apptFilterCertType) params.push(`certificate_type=${this.apptFilterCertType}`);
    if (this.apptFilterRegType)  params.push(`registration_type=${encodeURIComponent(this.apptFilterRegType)}`);

    const url = `${this.API}/api/staff/appointments` + (params.length ? '?' + params.join('&') : '');
    this.http.get<any[]>(url, { headers: this.authHeaders })
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
      under_review: 'Under Review', for_release: 'For Release',
      released: 'Released', approved: 'Approved',
      denied: 'Denied', pending: 'Pending'
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

  // ── Profile check ─────────────────────────────────────────
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
      if (user.detailsCompleted) this.showProfileModal = false;
    }
  }

  goToProfile(): void { this.router.navigate(['/account']); }

  viewRequestDetail(request: any)   { this.router.navigate(['/request-detail',  request.RequestID]); }
  viewInProcessDetail(request: any) { this.router.navigate(['/process-request', request.RequestID]); }

  // ── Helpers shared by reschedule ──────────────────────────
  private isWeekend(dateStr: string): boolean {
    const d = new Date(dateStr);
    const day = d.getUTCDay();
    return day === 0 || day === 6;
  }

  // ================================================================
  // STAFF: RESCHEDULE SINGLE APPOINTMENT
  // ================================================================
  openStaffRescheduleModal(appt: any) {
    this.staffRescheduleTarget       = appt;
    this.staffRescheduleDate         = '';
    this.staffRescheduleTime         = '';
    this.staffRescheduleSlots        = [];
    this.staffRescheduleStep         = 1;
    this.staffRescheduleDateError    = '';
    this.isStaffRescheduling         = false;
    this.staffRescheduleLoadingSlots = false;
    this.staffRescheduleMinDate      = new Date().toISOString().split('T')[0];
    this.staffRescheduleModalVisible = true;
  }

  closeStaffRescheduleModal() {
    this.staffRescheduleModalVisible = false;
    this.staffRescheduleTarget = null;
  }

  onStaffRescheduleDateChange() {
    this.staffRescheduleTime      = '';
    this.staffRescheduleSlots     = [];
    this.staffRescheduleDateError = '';
    if (!this.staffRescheduleDate) return;

    if (this.isWeekend(this.staffRescheduleDate)) {
      this.staffRescheduleDateError = 'Appointments are only available Monday to Friday.';
      return;
    }
    this.fetchStaffRescheduleSlots();
  }

  fetchStaffRescheduleSlots() {
    this.staffRescheduleLoadingSlots = true;
    this.http.get<any[]>(`${this.API}/api/appointments/slots?date=${this.staffRescheduleDate}`)
      .subscribe({
        next: (slots) => { this.staffRescheduleSlots = slots; this.staffRescheduleLoadingSlots = false; },
        error: () => {
          this.staffRescheduleLoadingSlots = false;
          this.staffRescheduleDateError = 'Failed to load slots. Please try again.';
        }
      });
  }

  confirmStaffReschedule() {
    if (!this.staffRescheduleDate || !this.staffRescheduleTime || !this.staffRescheduleTarget) return;
    this.isStaffRescheduling = true;
    this.http.put(
      `${this.API}/api/staff/appointments/${this.staffRescheduleTarget.id}/reschedule`,
      { appt_date: this.staffRescheduleDate, appt_time: this.staffRescheduleTime },
      { headers: this.authHeaders }
    ).subscribe({
      next: (res: any) => {
        this.isStaffRescheduling = false;
        this.closeStaffRescheduleModal();
        this.fetchAppointments();
        this.showResult('success', res.message || 'Appointment rescheduled successfully.');
      },
      error: (err) => {
        this.isStaffRescheduling = false;
        this.showResult('error', err.error?.message || 'Failed to reschedule appointment.');
      }
    });
  }

  // ================================================================
  // STAFF: RESCHEDULE ENTIRE DAY
  // ================================================================
  openRescheduleDayModal() {
    this.rescheduleDayFrom        = '';
    this.rescheduleDayTo          = '';
    this.rescheduleDayFromError   = '';
    this.rescheduleDayToError     = '';
    this.rescheduleDayFromCount   = null;
    this.rescheduleDayStep        = 1;
    this.isReschedulingDay        = false;
    this.staffRescheduleMinDate   = new Date().toISOString().split('T')[0];
    this.rescheduleDayModalVisible = true;
  }

  closeRescheduleDayModal() {
    this.rescheduleDayModalVisible = false;
  }

  onRescheduleDayFromChange() {
    this.rescheduleDayFromError = '';
    this.rescheduleDayFromCount = null;
    if (!this.rescheduleDayFrom) return;

    if (this.isWeekend(this.rescheduleDayFrom)) {
      this.rescheduleDayFromError = 'Selected day must be a weekday.';
      return;
    }

    // Fetch count of confirmed appointments on that day
    this.http.get<any[]>(
      `${this.API}/api/staff/appointments?date=${this.rescheduleDayFrom}&status=confirmed`,
      { headers: this.authHeaders }
    ).subscribe({
      next: (data) => {
        this.rescheduleDayFromCount = data.length;
        if (data.length === 0) {
          this.rescheduleDayFromError = 'No confirmed appointments found on this day.';
        }
      },
      error: () => {
        this.rescheduleDayFromError = 'Failed to check appointments. Try again.';
      }
    });
  }

  onRescheduleDayToChange() {
    this.rescheduleDayToError = '';
    if (!this.rescheduleDayTo) return;

    if (this.isWeekend(this.rescheduleDayTo)) {
      this.rescheduleDayToError = 'New day must be a weekday.';
      return;
    }
    if (this.rescheduleDayTo === this.rescheduleDayFrom) {
      this.rescheduleDayToError = 'New day must be different from the original day.';
    }
  }

  confirmRescheduleDay() {
    if (!this.rescheduleDayFrom || !this.rescheduleDayTo) return;
    this.isReschedulingDay = true;
    this.http.put(
      `${this.API}/api/staff/appointments/reschedule-day`,
      { from_date: this.rescheduleDayFrom, to_date: this.rescheduleDayTo },
      { headers: this.authHeaders }
    ).subscribe({
      next: (res: any) => {
        this.isReschedulingDay = false;
        this.closeRescheduleDayModal();
        this.fetchAppointments();
        this.showResult('success', res.message || 'Day rescheduled successfully.');
      },
      error: (err) => {
        this.isReschedulingDay = false;
        this.showResult('error', err.error?.message || 'Failed to reschedule day.');
      }
    });
  }
}
