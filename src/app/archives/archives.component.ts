import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-archives',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.css']
})
export class ArchivesComponent implements OnInit {
  archivedRequests: any[] = [];
  filteredRequests: any[] = [];
  private API = 'https://drtbackend-2cw3.onrender.com';

  showRestoreModal = false;
  showDeleteModal  = false;
  selectedDoc: any = null;

  // Search & filter
  searchTerm   = '';
  filterStatus = '';

  // Pagination
  itemsPerPage = 10;
  currentPage  = 1;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadArchived(); }

  get token() { return localStorage.getItem('token') || ''; }

  loadArchived() {
    this.http.get<any[]>(`${this.API}/api/admin/document_request`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: (data) => {
        this.archivedRequests = data.filter(d => d.archived === 1);
        this.applyFilter();
      },
      error: (err) => console.error('Failed to fetch archived requests', err)
    });
  }

  applyFilter() {
    this.currentPage = 1;
    this.filteredRequests = this.archivedRequests.filter(doc => {
      const matchesStatus = this.filterStatus
        ? doc.status?.toLowerCase() === this.filterStatus.toLowerCase()
        : true;
      const term = this.searchTerm.toLowerCase();
      const matchesSearch = !term ||
        (doc.name?.toLowerCase().includes(term)) ||
        (this.getDocumentLabel(doc.document_type || '').toLowerCase().includes(term));
      return matchesStatus && matchesSearch;
    });
  }

  // ── Pagination ──────────────────────────────────────────
  getPaginatedRequests(): any[] {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredRequests.slice(start, start + this.itemsPerPage);
  }

  getTotalPages(): number[] {
    return Array(Math.ceil(this.filteredRequests.length / this.itemsPerPage))
      .fill(0).map((_, i) => i + 1);
  }

  // ── Actions ─────────────────────────────────────────────
  confirmRestore(doc: any) {
    this.selectedDoc = doc;
    this.showRestoreModal = true;
  }

  confirmDelete(doc: any) {
    this.selectedDoc = doc;
    this.showDeleteModal = true;
  }

  restore() {
    if (!this.selectedDoc) return;
    this.http.put(`${this.API}/api/document_request/${this.selectedDoc.RequestID}/restore`, {}, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: () => {
        this.archivedRequests = this.archivedRequests.filter(d => d.RequestID !== this.selectedDoc.RequestID);
        this.applyFilter();
        this.showRestoreModal = false;
        this.selectedDoc = null;
      },
      error: (err) => console.error('Failed to restore', err)
    });
  }

  permanentDelete() {
    if (!this.selectedDoc) return;
    this.http.delete(`${this.API}/api/document_request/${this.selectedDoc.RequestID}/permanent`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: () => {
        this.archivedRequests = this.archivedRequests.filter(d => d.RequestID !== this.selectedDoc.RequestID);
        this.applyFilter();
        this.showDeleteModal = false;
        this.selectedDoc = null;
      },
      error: (err) => console.error('Failed to delete', err)
    });
  }

  closeModals() {
    this.showRestoreModal = false;
    this.showDeleteModal  = false;
    this.selectedDoc      = null;
  }

  getDocumentLabel(type: string): string {
    const map: Record<string, string> = {
      birth:    'Birth Certificate',
      death:    'Death Certificate',
      marriage: 'Marriage Certificate'
    };
    return map[type] || type;
  }
}
