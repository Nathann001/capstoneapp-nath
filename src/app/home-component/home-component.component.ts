import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-home-component',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home-component.component.html',
  styleUrl: './home-component.component.css'
})
export class HomeComponentComponent implements OnInit {
  @ViewChild('certificateContainer', { static: false }) certificateContainer!: ElementRef;
  pendingCertificates: any[] = [];
  certificates: any[] = [];
  documentRequests: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {

    this.fetchDocumentRequests();
  }

  fetchDocumentRequests() {
    this.http.get<any[]>('http://localhost:4000/api/document_request')
      .subscribe({
        next: (data) => {
          this.documentRequests = data;
        },
        error: (err) => console.error('Failed to fetch document requests', err)
      });
  }
}
