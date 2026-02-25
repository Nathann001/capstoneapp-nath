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
  rows: (1 | 2)[] = [1, 2];

  stats = {
    approved:     { today: 0, week: 0, month: 0 },
    denied:       { today: 0, week: 0, month: 0 },
    pending:      { today: 0, week: 0, month: 0 },
    under_review: { today: 0, week: 0, month: 0 }
  };

  selectedRow1: 'approved' | 'denied' | 'pending' | 'under_review' = 'approved';
  selectedRow2: 'approved' | 'denied' | 'pending' | 'under_review' = 'denied';

  itemsPerPage = 6;
  currentPage1 = 1;
  currentPage2 = 1;

  // ── Archive modal ─────────────────────────────────────────
  showArchiveModal = false;
  docToArchive: any = null;

  // ── Confirm modal ─────────────────────────────────────────
  showConfirmModal    = false;
  confirmModalTitle   = '';
  confirmModalMessage = '';
  pendingAction: (() => void) | null = null;

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

  // ── Loaders ───────────────────────────────────────────────
  loadRequests() {
    const token = localStorage.getItem('token');
    if (!token) return console.error('No token found.');

    this.http.get<any[]>(this.ADMIN_API, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        const active = data.filter(d => d.archived === 0);
        this.documentRequests = active.filter(d => d.status === 'pending');
        this.inProcess        = active.filter(d => d.status === 'under_review');
        this.approved         = active.filter(d => d.status === 'approved');
        this.denied           = active.filter(d => d.status === 'denied');
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
      next: (data) => { this.for_release = data; },
      error: (err) => console.error('Failed to fetch For Release requests', err)
    });
  }

  fetchReleasedRequests() {
    const token = localStorage.getItem('token') || '';
    this.http.get<any[]>(`${this.DOC_API}/released_list`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => { this.released = data; },
      error: (err) => console.error('Failed to fetch Released requests', err)
    });
  }

  // ── Pagination ────────────────────────────────────────────
  getTableForRow(row: 1 | 2) {
    const cat = row === 1 ? this.selectedRow1 : this.selectedRow2;
    switch (cat) {
      case 'approved':     return this.approved;
      case 'denied':       return this.denied;
      case 'pending':      return this.documentRequests;
      case 'under_review': return this.inProcess;
      default:             return [];
    }
  }

  getPaginatedItems(row: 1 | 2) {
    const list = this.getTableForRow(row);
    const page = row === 1 ? this.currentPage1 : this.currentPage2;
    const start = (page - 1) * this.itemsPerPage;
    return list.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(row: 1 | 2) {
    return Array(Math.ceil(this.getTableForRow(row).length / this.itemsPerPage))
      .fill(0).map((_, i) => i + 1);
  }

  changePage(row: 1 | 2, page: number) {
    if (row === 1) this.currentPage1 = page;
    else           this.currentPage2 = page;
  }

  // ── Archive ───────────────────────────────────────────────
  confirmArchive(doc: any, event: Event) {
    event.stopPropagation();
    this.docToArchive    = doc;
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
        this.documentRequests = this.documentRequests.filter(d => d.RequestID !== id);
        this.inProcess        = this.inProcess.filter(d => d.RequestID !== id);
        this.approved         = this.approved.filter(d => d.RequestID !== id);
        this.denied           = this.denied.filter(d => d.RequestID !== id);
        this.for_release      = this.for_release.filter(d => d.RequestID !== id);
        this.released         = this.released.filter(d => d.RequestID !== id);
        this.closeArchiveModal();
        this.showResult('success', 'Request archived successfully.');
      },
      error: (err) => {
        this.closeArchiveModal();
        this.showResult('error', err.error?.message || 'Failed to archive request.');
      }
    });
  }

  // ── Confirm modal helpers ─────────────────────────────────
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

  // ── Helpers ───────────────────────────────────────────────
  isSameDay(a: Date, b: Date)   { return a.toDateString() === b.toDateString(); }
  isSameWeek(a: Date, b: Date)  { return Math.abs(a.getTime() - b.getTime()) / (24*60*60*1000) < 7; }
  isSameMonth(a: Date, b: Date) { return a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear(); }

  formatStatName(name: string) {
    return name === 'under_review' ? 'Under Review' : name.charAt(0).toUpperCase() + name.slice(1);
  }

  getDocumentLabel(type: string): string {
    const map: Record<string, string> = {
      birth: 'Birth Certificate',
      death: 'Death Certificate',
      marriage: 'Marriage Certificate'
    };
    return map[type] || type;
  }

  viewRequestDetail(doc: any)   { console.log('View Request Detail', doc); }
  viewInProcessDetail(doc: any) { console.log('View In Process Detail', doc); }
}
