import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface RequirementItem {
  question: string;
  answer: string;
  items?: string[];
  fees?: { label: string; amount: string }[];
}

interface DocRequirements {
  title: string;
  icon: string;
  color: string;
  pdfPath: string;
  description: string;
  faqs: RequirementItem[];
}

@Component({
  selector: 'app-requirements',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './requirements.html',
  styleUrls: ['./requirements.css']
})
export class RequirementsComponent implements OnInit {

  docType = '';
  activeIndex: number | null = null;
  doc: DocRequirements | null = null;

  private requirementsData: Record<string, DocRequirements> = {
    'birth': {
      title: 'Certified True Copy of Birth Certificate',
      icon: 'fa-solid fa-baby',
      color: '#2a7ca8',
      pdfPath: '/assets/documents/issuance-of-certified-copy-of-birth-others.pdf',
      description: 'A certified true copy of a birth certificate is an official document issued by the Civil Registry Office confirming the details of a registered birth.',
      faqs: [
        {
          question: 'Who may request a certified true copy of a birth certificate?',
          answer: 'The following persons may file the request:',
          items: [
            'The document owner (if of legal age)',
            'Parents or legal guardian',
            'Spouse or direct descendants',
            'Authorized representative with a Special Power of Attorney (SPA)'
          ]
        },
        {
          question: 'What are the requirements for On-Time registration (within 30 days)?',
          answer: 'Please bring the following documents:',
          items: [
            'Duly accomplished and signed Certificate of Live Birth',
            'For unmarried parents: Affidavit of Acknowledgment / Admission of Paternity',
            'For unmarried parents: Affidavit to Use the Surname of the Father (RA 9255)',
            'Both parents must be present during registration (in person)'
          ]
        },
        {
          question: 'What are the requirements for Delayed registration (after 30 days)?',
          answer: 'Please bring the following documents:',
          items: [
            'Duly accomplished and signed Certificate of Live Birth',
            'PSA Certificate of No Registration',
            'For adults (18–59): Any two of the following — Baptismal Certificate, Voter\'s Certification, Form 137, SSS E-1, or Passport',
            'For minors: Baptismal Certificate and School Record (Form 137)',
            'For minors: Medical Certificate or Immunization Card',
            'If parents are unmarried: Affidavit of Admission of Paternity',
            'If parents are unmarried: Affidavit to Use the Surname of the Father (RA 9255)'
          ]
        },
        {
          question: 'What are the fees involved?',
          answer: 'The following fees apply for unmarried parents:',
          fees: [
            { label: 'Affidavit to Use Surname of Father', amount: '₱300.00' },
            { label: '3 Certifications (₱50.00 each)', amount: '₱150.00' },
            { label: 'UP Law Center (UPLC)', amount: '₱10.00' }
          ]
        },
        {
          question: 'How long does the process take?',
          answer: 'Processing typically takes 1–3 working days depending on the volume of requests. You will be notified via email once your request is ready for release.'
        },
        {
          question: 'Where do I go after submitting my request?',
          answer: 'Proceed to the Civil Registry Office at the Angeles City Hall. For On-Time registration, go to Counter 2. For Delayed registration, go to Counter 1.'
        }
      ]
    },

    'death': {
      title: 'Certified True Copy of Death Certificate',
      icon: 'fa-solid fa-ribbon',
      color: '#4a5568',
      pdfPath: '/assets/documents/registration-of-death-on-time.pdf',
      description: 'A certified true copy of a death certificate is an official document issued by the Civil Registry Office confirming the registered details of a person\'s death.',
      faqs: [
        {
          question: 'Who may request a certified true copy of a death certificate?',
          answer: 'The following persons may file:',
          items: [
            'Nearest relative of the deceased',
            'Authorized representative with a Special Power of Attorney (SPA)',
            'Legal counsel or authorized government agency'
          ]
        },
        {
          question: 'What are the requirements for On-Time registration (within 30 days)?',
          answer: 'Please bring the following:',
          items: [
            'Duly accomplished and signed Death Certificate (MF 103)',
            'Must be filed by the physician who last attended the deceased, nearest relative, or funeral provider'
          ]
        },
        {
          question: 'What are the requirements for Delayed registration (after 30 days)?',
          answer: 'Please bring the following:',
          items: [
            'Duly accomplished and signed Death Certificate Form',
            'Resident Certificate / Cedula',
            'If less than 1 year from death: Official Receipt of Certification from Funeral Parlor',
            'If more than 1 year from death: PSA Certificate of No Registration',
            'If more than 1 year from death: Official Receipt of Certification from Funeral Parlor'
          ]
        },
        {
          question: 'What are the permit fees?',
          answer: 'The following permit fees apply:',
          fees: [
            { label: 'Burial Permit', amount: '₱50.00' },
            { label: 'Cremation Permit', amount: '₱500.00' },
            { label: 'Transfer Permit', amount: '₱100.00' },
            { label: 'Disinterment Permit', amount: '₱75.00' }
          ]
        },
        {
          question: 'Where do I go after submitting my request?',
          answer: 'Proceed to the Civil Registry Office at the Angeles City Hall. For On-Time registration, go to Counter 2. For Delayed registration, go to Counter 1.'
        }
      ]
    },

    'marriage': {
      title: 'Certified True Copy of Marriage Certificate',
      icon: 'fa-solid fa-heart',
      color: '#c0392b',
      pdfPath: '/assets/documents/registration-of-marriage-on-time.pdf',
      description: 'A certified true copy of a marriage certificate is an official document confirming the details of a registered marriage.',
      faqs: [
        {
          question: 'Who may request a certified true copy of a marriage certificate?',
          answer: 'The following may file:',
          items: [
            'The husband or wife',
            'Solemnizing officer',
            'Parents of either party',
            'Authorized representative with a Special Power of Attorney (SPA)'
          ]
        },
        {
          question: 'What are the requirements for On-Time registration (within 15 days)?',
          answer: 'Please bring the following:',
          items: [
            'Duly accomplished and signed Marriage Certificate (MF 102)',
            'Must be filed by the solemnizing officer, the married couple, or parents'
          ]
        },
        {
          question: 'What are the requirements for Delayed registration (after 15 days)?',
          answer: 'Please bring the following:',
          items: [
            'Duly accomplished Marriage Certificate (MF 102)',
            'If less than 1 year: Unregistered Marriage Contract (MF 102) — 4 copies',
            'If less than 1 year: PSA Certificate of No Marriage (CENOMAR)',
            'If less than 1 year: Marriage License or Affidavit of Cohabitation',
            'If more than 1 year: PSA Certificate of No Marriage (CENOMAR)',
            'If more than 1 year: PSA Certificate of No Registration',
            'If more than 1 year: Resident Certificate / Cedula of Informant'
          ]
        },
        {
          question: 'What are the office hours for this service?',
          answer: 'The Civil Registry Office processes marriage certificate requests Monday to Friday, 8:00 AM to 5:00 PM with no noon break.'
        },
        {
          question: 'Where do I go after submitting my request?',
          answer: 'Proceed to the Civil Registry Office at the Angeles City Hall. For On-Time registration, go to Counter 2. For Delayed registration, go to Counter 1.'
        }
      ]
    },

    'marriage-license': {
      title: 'Issuance of Marriage License',
      icon: 'fa-solid fa-rings-wedding',
      color: '#8e44ad',
      pdfPath: '/assets/documents/issuance-of-marriage-license.pdf',
      description: 'A marriage license is a legal document required before solemnizing a marriage. It must be obtained at the Civil Registry Office of the city or municipality where either party resides.',
      faqs: [
        {
          question: 'Who may apply for a marriage license?',
          answer: 'Both parties intending to marry must personally appear at the Civil Registry Office to apply.'
        },
        {
          question: 'What are the basic requirements?',
          answer: 'The following documents are required from both parties:',
          items: [
            'Birth Certificate (PSA copy)',
            'Certificate of No Marriage (CENOMAR) from PSA',
            'Community Tax Certificate (Cedula)',
            'Valid government-issued ID',
            'Parental consent or advice if applicable (for ages 18–25)',
            'Certificate of attendance in pre-marriage counseling / family planning seminar'
          ]
        },
        {
          question: 'Are there additional requirements for foreign nationals?',
          answer: 'Yes. Foreign nationals must additionally provide:',
          items: [
            'Legal capacity to contract marriage issued by their embassy or consulate',
            'Valid passport',
            'Divorce decree (if previously married abroad)'
          ]
        },
        {
          question: 'How long is a marriage license valid?',
          answer: 'A marriage license is valid for 120 days from the date of issue and is valid anywhere in the Philippines.'
        },
        {
          question: 'What are the fees?',
          answer: 'Fees vary depending on residency status. Please inquire at the Civil Registry Office for the current schedule of fees.'
        },
        {
          question: 'How long does processing take?',
          answer: 'There is a mandatory 10-day publication period after filing before the license can be issued, provided no objections are raised during that period.'
        }
      ]
    }
  };

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.docType = this.route.snapshot.paramMap.get('docType') || '';
    this.doc = this.requirementsData[this.docType] || null;
  }

  toggle(index: number): void {
    this.activeIndex = this.activeIndex === index ? null : index;
  }

  openPdf(): void {
    if (this.doc?.pdfPath) {
      window.open(this.doc.pdfPath, '_blank', 'noopener,noreferrer');
    }
  }

  goBack(): void {
    this.router.navigate(['/documents']);
  }
}
