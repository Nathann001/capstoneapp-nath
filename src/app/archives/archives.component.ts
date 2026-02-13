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

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadArchived();
  }

  loadArchived() {
    const token = localStorage.getItem('token');
    if (!token) return console.error('No token found. Please log in.');

    this.http.get<any[]>('http://localhost:4000/api/admin/document_request', {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => {
        this.archivedRequests = data.filter(d => d.archived === 1);
      },
      error: (err) => console.error('Failed to fetch archived requests', err)
    });
  }
}
