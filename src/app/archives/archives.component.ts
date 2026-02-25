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

  restore(doc: any) {
    if (!confirm(`Restore "${doc.name}"?`)) return;

    this.http.put(`${this.API}/api/document_request/${doc.RequestID}/restore`, {}, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: () => { this.archivedRequests = this.archivedRequests.filter(d => d.RequestID !== doc.RequestID); },
      error: (err) => console.error('Failed to restore', err)
    });
  }

  permanentDelete(doc: any) {
    if (!confirm(`Permanently delete "${doc.name}"? This cannot be undone.`)) return;

    this.http.delete(`${this.API}/api/document_request/${doc.RequestID}/permanent`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: () => { this.archivedRequests = this.archivedRequests.filter(d => d.RequestID !== doc.RequestID); },
      error: (err) => console.error('Failed to delete', err)
    });
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
