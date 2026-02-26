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
  documentRequests: any[] = [];
  inProcess: any[] = [];
  approved: any[] = [];
  denied: any[] = [];
  for_release: any[] = [];
  released: any[] = [];

  stats = {
    approved:     { today: 0, week: 0, month: 0 },
    denied:       { today: 0, week: 0, month: 0 },
    pending:      { today: 0, week: 0, month: 0 },
    under_review: { today: 0, week: 0, month: 0 }
  };

  selectedRow1: 'approved' | 'denied' | 'pending' | 'under_review' = 'approved';
  selectedRow2: 'approved' | 'denied' | 'pending' | 'under_review' = 'denied';

  // ── Pagination ────────────────────────────────────────────
  itemsPerPage          = 10;
  currentPageApproved   = 1;
  currentPageDenied     = 1;
  currentPageForRelease = 1;
  currentPageReleased   = 1;

  // ── Archive modal ─────────────────────────────────────────
  showArchiveModal = false;
  docToArchive: any = null;

  // ── Result modal ──────────────────────────────────────────
  showResultModal    = false;
  resultModalType: 'success' | 'error' = 'success';
  resultModalMessage = '';

  private DOC_API   = 'https://drtbackend-2cw3.onrender.com/api/document_request';
  private ADMIN_API = 'https://drtbackend-2cw3.onrender.com/api/admin/document_request';

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadRequests();
    this.fetchForReleaseRequests();
    this.fetchReleasedRequests();
  }

  // ── Staff name resolver ───────────────────────────────────
  // Checks all possible field names the API might return for assigned staff.
  // Log doc keys in console if staff still doesn't appear so you can add the field.
  getStaffName(doc: any): string | null {
    return doc.assigned_staff_name
      || doc.staff_name
      || doc.assignedStaff
      || doc.assigned_staff
      || doc.staffName
      || doc.staff_full_name
      || null;
  }

  // ── Sort helper: oldest first ─────────────────────────────
  private sortOldestFirst(arr: any[]): any[] {
    return arr.sort((a, b) =>
      new Date(a.date_created || a.updated_at).getTime() -
      new Date(b.date_created || b.updated_at).getTime()
    );
  }

  // ── Loaders ───────────────────────────────────────────────
  loadRequests() {
    const token = localStorage.getItem('token');
    if (!token) return console.error('No token found.');

    this.http.get<any[]>(this.ADMIN_API, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        const active = data.filter(d => d.archived === 0);
        this.documentRequests = this.sortOldestFirst(active.filter(d => d.status === 'pending'));
        this.inProcess        = this.sortOldestFirst(active.filter(d => d.status === 'under_review'));
        this.approved         = this.sortOldestFirst(active.filter(d => d.status === 'approved'));
        this.denied           = this.sortOldestFirst(active.filter(d => d.status === 'denied'));

        // Debug: log a sample denied record so you can confirm the staff field name
        if (this.denied.length > 0) {
          console.log('[DEBUG] Sample denied record keys:', Object.keys(this.denied[0]));
          console.log('[DEBUG] Sample denied record:', this.denied[0]);
        }

        this.calculateStats(data);
      },
      error: (err) => console.error('Failed to fetch document requests', err)
    });
  }

  fetchForReleaseRequests() {
    const token = localStorage.getItem('token') || '';
    this.http.get<any[]>(`${this.DOC_API}/for_release`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.for_release = this.sortOldestFirst(data);
        if (this.for_release.length > 0) {
          console.log('[DEBUG] Sample for_release record keys:', Object.keys(this.for_release[0]));
        }
      },
      error: (err) => console.error('Failed to fetch For Release requests', err)
    });
  }

  fetchReleasedRequests() {
    const token = localStorage.getItem('token') || '';
    this.http.get<any[]>(`${this.DOC_API}/released_list`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => { this.released = this.sortOldestFirst(data); },
      error: (err) => console.error('Failed to fetch Released requests', err)
    });
  }

  // ── Generic pagination helpers ────────────────────────────
  private paginate(arr: any[], page: number): any[] {
    const start = (page - 1) * this.itemsPerPage;
    return arr.slice(start, start + this.itemsPerPage);
  }

  private totalPages(arr: any[]): number[] {
    return Array(Math.ceil(arr.length / this.itemsPerPage)).fill(0).map((_, i) => i + 1);
  }

  getPaginatedApproved(): any[]     { return this.paginate(this.approved,    this.currentPageApproved);   }
  getTotalPagesApproved(): number[] { return this.totalPages(this.approved);                               }

  getPaginatedDenied(): any[]       { return this.paginate(this.denied,      this.currentPageDenied);      }
  getTotalPagesDenied(): number[]   { return this.totalPages(this.denied);                                 }

  getPaginatedForRelease(): any[]      { return this.paginate(this.for_release, this.currentPageForRelease); }
  getTotalPagesForRelease(): number[]  { return this.totalPages(this.for_release);                           }

  getPaginatedReleased(): any[]      { return this.paginate(this.released,   this.currentPageReleased);    }
  getTotalPagesReleased(): number[]  { return this.totalPages(this.released);                              }

  // ── Archive ───────────────────────────────────────────────
  confirmArchive(doc: any, event: Event) {
    event.stopPropagation();
    this.docToArchive     = doc;
    this.showArchiveModal = true;
  }

  closeArchiveModal() {
    this.showArchiveModal = false;
    this.docToArchive = null;
  }

  archiveRequest() {
    if (!this.docToArchive) return;
    const token = localStorage.getItem('token') || '';
    const id    = this.docToArchive.RequestID;

    this.http.put(`${this.DOC_API}/${id}/archive`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: () => {
        this.approved    = this.approved.filter(d => d.RequestID !== id);
        this.denied      = this.denied.filter(d => d.RequestID !== id);
        this.for_release = this.for_release.filter(d => d.RequestID !== id);
        this.released    = this.released.filter(d => d.RequestID !== id);
        this.closeArchiveModal();
        this.showResult('success', 'Request archived successfully.');
      },
      error: (err) => {
        this.closeArchiveModal();
        this.showResult('error', err.error?.message || 'Failed to archive request.');
      }
    });
  }

  // ── Result modal helpers ──────────────────────────────────
  showResult(type: 'success' | 'error', message: string) {
    this.resultModalType    = type;
    this.resultModalMessage = message;
    this.showResultModal    = true;
  }

  closeResultModal() { this.showResultModal = false; }

  // ── Stats ─────────────────────────────────────────────────
  calculateStats(data: any[]) {
    const now = new Date();
    const countByPeriod = (arr: any[], fn: (d: Date) => boolean) =>
      arr.filter(d => fn(new Date(d.updated_at || d.date_created))).length;

    for (const status of ['approved', 'denied', 'pending', 'under_review'] as const) {
      const arr = data.filter(d => d.status === status);
      this.stats[status].today = countByPeriod(arr, d => this.isSameDay(d, now));
      this.stats[status].week  = countByPeriod(arr, d => this.isSameWeek(d, now));
      this.stats[status].month = countByPeriod(arr, d => this.isSameMonth(d, now));
    }
  }

  isSameDay(a: Date, b: Date)   { return a.toDateString() === b.toDateString(); }
  isSameWeek(a: Date, b: Date)  { return Math.abs(a.getTime() - b.getTime()) / (24 * 60 * 60 * 1000) < 7; }
  isSameMonth(a: Date, b: Date) { return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); }

  formatStatName(name: string): string {
    return name === 'under_review' ? 'Under Review' : name.charAt(0).toUpperCase() + name.slice(1);
  }

  getDocumentLabel(type: string): string {
    const map: Record<string, string> = {
      birth:    'Birth Certificate',
      death:    'Death Certificate',
      marriage: 'Marriage Certificate'
    };
    return map[type] || type;
  }

  viewRequestDetail(doc: any)   { console.log('View Request Detail', doc); }
  viewInProcessDetail(doc: any) { console.log('View In Process Detail', doc); }
}
