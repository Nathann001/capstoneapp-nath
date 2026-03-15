import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface CityDocument {
  name: string;
  docType: string;
  applyRoute: string;
  isAppointment?: boolean;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.css']
})
export class DocumentsComponent {

  constructor(private router: Router) {}

  documents: CityDocument[] = [
    {
      name: 'Issuance of Certified True Copy of Birth Certificate',
      docType: 'birth',
      applyRoute: '/registration-of-birth-on-time'
    },
    {
      name: 'Issuance of Certified True Copy of Death Certificate',
      docType: 'death',
      applyRoute: '/registration-of-death-on-time'
    },
    {
      name: 'Issuance of Certified True Copy of Marriage Certificate',
      docType: 'marriage',
      applyRoute: '/registration-of-marriage-on-time'
    },
    {
      name: 'Issuance of Marriage License',
      docType: 'marriage-license',
      applyRoute: '/issuance-of-married-license'
    },
    {
      name: 'Appointment Booking for Registration of Certificates',
      docType: '',
      applyRoute: '/appointment-booking',
      isAppointment: true
    }
  ];

  getDocIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('birth'))    return 'fa-solid fa-baby';
    if (n.includes('death'))    return 'fa-solid fa-ribbon';
    if (n.includes('marriage') && n.includes('license')) return 'fa-solid fa-rings-wedding';
    if (n.includes('marriage')) return 'fa-solid fa-heart';
    return 'fa-solid fa-file-certificate';
  }

  viewRequirements(docType: string): void {
    this.router.navigate(['/requirements', docType]);
  }

  applyForDocument(route: string): void {
    this.router.navigate([route]);
  }
}
