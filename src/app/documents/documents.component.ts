import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface CityDocument {
  name: string;
  file: string;
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
      file: '/assets/documents/issuance-of-certified-copy-of-birth-others.pdf',
      applyRoute: '/registration-of-birth-on-time'
    },
    {
      name: 'Issuance of Certified True Copy of Death Certificate',
      file: '/assets/documents/issuance-of-certified-copy-of-birth-others.pdf',
      applyRoute: '/registration-of-death-on-time'
    },
    {
      name: 'Issuance of Certified True Copy of Marriage Certificate',
      file: '/assets/documents/issuance-of-certified-copy-of-birth-others.pdf',
      applyRoute: '/registration-of-marriage-on-time'
    },
    {
      name: 'Issuance of Marriage License',
      file: '/assets/documents/issuance-of-marriage-license.pdf',
      applyRoute: '/issuance-of-married-license'
    },
    {
      name: 'Appointment Booking for Registration of Certificates',
      file: '',
      applyRoute: '/appointment-booking',
      isAppointment: true
    }
  ];

  /** Returns an appropriate Font Awesome icon class based on document name keywords */
  getDocIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('birth'))    return 'fa-solid fa-baby';
    if (n.includes('death'))    return 'fa-solid fa-ribbon';
    if (n.includes('marriage') && n.includes('license')) return 'fa-solid fa-rings-wedding';
    if (n.includes('marriage')) return 'fa-solid fa-heart';
    return 'fa-solid fa-file-certificate';
  }

  viewDocument(file: string): void {
    window.open(file, '_blank', 'noopener,noreferrer');
  }

  applyForDocument(route: string): void {
    this.router.navigate([route]);
  }
}
