import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface CityDocument {
  name: string;
  file: string;
  applyRoute: string;
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
      name: 'Registration of Birth Certificate (On-Time Registration)',
      file: '/assets/documents/registration-of-birth-on-time.pdf',
      applyRoute: '/registration-of-birth-on-time'
    },
    {
      name: 'Registration of Death Certificate (On-Time Registration)',
      file: '/assets/documents/registration-of-death-on-time.pdf',
      applyRoute: '/registration-of-death-on-time'
    },
    {
      name: 'Registration of Marriage Certificate (On-Time Registration)',
      file: '/assets/documents/registration-of-marriage-on-time.pdf',
      applyRoute: '/registration-of-marriage-on-time'
    },
    {
      name: 'Issuance of Certified True Copy of Birth, Marriage, Death and Other Registry Documents',
      file: '/assets/documents/issuance-of-certified-copy-of-birth-others.pdf',
      applyRoute: '/issuance-of-certified-copy-of-birth-others'
    },
    {
      name: 'Issuance of Marriage License',
      file: '/assets/documents/issuance-of-marriage-license.pdf',
      applyRoute: '/issuance-of-married-license'
    },
    {
      name: 'Delayed Registration of Birth Certificate',
      file: '/assets/documents/delayed-registration-of-birth.pdf',
      applyRoute: '/delayed-registration-of-birth'
    },
    {
      name: 'Delayed Registration of Marriage Certificate',
      file: '/assets/documents/delayed-registration-of-marriage.pdf',
      applyRoute: '/delayed-registration-of-marriage'
    },
    {
      name: 'Delayed Registration of Death Certificate',
      file: '/assets/documents/delayed-registration-of-death.pdf',
      applyRoute: '/delayed-registration-of-death'
    }
  ];

  viewDocument(file: string): void {
    window.open(file, '_blank', 'noopener,noreferrer');
  }

  applyForDocument(route: string): void {
    this.router.navigate([route]);
  }
}
