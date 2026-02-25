import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-archives',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './archives.component.html',
  styleUrls: ['./archives.component.css']
})
export class ArchivesComponent implements OnInit {
  archivedRequests: any[] = [];
  private API = 'https://drtbackend-2cw3.onrender.com';

  showRestoreModal = false;
  showDeleteModal = false;
  selectedDoc: any = null;

  constructor(private http: HttpClient) {}

  ngOnInit() { this.loadArchived(); }

  get token() { return localStorage.getItem('token') || ''; }

  loadArchived() {
    this.http.get<any[]>(`${this.API}/api/admin/document_request`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: (data) => { this.archivedRequests = data.filter(d => d.archived === 1); },
      error: (err) => console.error('Failed to fetch archived requests', err)
    });
  }

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
        this.showDeleteModal = false;
        this.selectedDoc = null;
      },
      error: (err) => console.error('Failed to delete', err)
    });
  }

  closeModals() {
    this.showRestoreModal = false;
    this.showDeleteModal = false;
    this.selectedDoc = null;
  }

  getDocumentLabel(type: string): string {
    const map: Record<string, string> = {
      birth: 'Birth Certificate',
      death: 'Death Certificate',
      marriage: 'Marriage Certificate'
    };
    return map[type] || type;
  }
}