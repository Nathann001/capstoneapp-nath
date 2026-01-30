import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-home-staff',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './home-staff.component.html',
  styleUrls: ['./home-staff.component.css']
})
export class HomeStaffComponent implements OnInit {
  documentRequests: any[] = [];
  inProcess: any[] = [];
  processed: any[] = [];
  denied: any[] = [];

  constructor(private http: HttpClient, private router: Router, private route: ActivatedRoute) {}

  ngOnInit() {
    this.fetchDocumentRequests();
    this.http.get<any[]>('http://localhost:4000/api/document_request')
  .subscribe({
    next: (data) => {
      console.log('Raw API data:', data);
    },
    error: (err) => console.error('Failed to fetch document requests', err)
  });

  }

 fetchDocumentRequests() {
  this.http.get<any[]>('http://localhost:4000/api/document_request')
    .subscribe({
      next: (data) => {
        console.log('Raw API data:', data);

        // Split data by status
        this.documentRequests = data.filter(d => d.status === 'requested');
        this.inProcess = data.filter(d => d.status === 'in_process');
        this.processed = data.filter(d => d.status === 'processed');
        this.denied = data.filter(d => d.status === 'denied');
      },
      error: (err) => console.error('Failed to fetch document requests', err)
    });
}



  // Redirect to detail page with the selected request
  viewRequestDetail(request: any) {
  this.router.navigate(['/request-detail', request.RequestID]);
}

viewInProcessDetail(request: any) {
  this.router.navigate(['../process-request', request.RequestID], {
    relativeTo: this.route
  });
}

}
