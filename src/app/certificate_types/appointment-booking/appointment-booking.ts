// ================================================================
// appointment-booking.component.ts  (REDESIGNED)
// ================================================================
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

interface Requirement {
  name: string;
  note?: string;
  copies?: string;
}

interface RequirementSection {
  section: string;
}

type RequirementEntry = Requirement | RequirementSection;

function isSection(r: RequirementEntry): r is RequirementSection {
  return (r as RequirementSection).section !== undefined;
}

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './appointment-booking.html',
  styleUrls: ['./appointment-booking.css']
})
export class AppointmentBookingComponent implements OnInit {
  private API = 'https://drtbackend-2cw3.onrender.com';

  // ---- Form state ----
  selectedDate: string = '';
  selectedTime: string = '';
  selectedCertType: string = '';
  selectedRegType: string = '';
  eventDate: string = '';
  minDate: string = '';
  maxDate: string = '';

  certificateTypes = ['Birth', 'Death', 'Marriage'];

  // ---- Slots ----
  slots: any[] = [];
  loadingSlots: boolean = false;

  // ---- Booking ----
  isBooking: boolean = false;

  // ---- Modal ----
  modalVisible: boolean = false;
  modalType: 'success' | 'error' = 'success';
  modalMessage: string = '';

  constructor(private http: HttpClient) {}

  ngOnInit() {
  const today = new Date();
  this.minDate = today.toISOString().split('T')[0];

  const maxD = new Date();
  maxD.setMonth(maxD.getMonth() + 1);
  this.maxDate = maxD.toISOString().split('T')[0];
}

  get token() { return localStorage.getItem('token') || ''; }

  get eventDateLabel(): string {
    if (this.selectedCertType === 'Birth') return 'Date of Birth';
    if (this.selectedCertType === 'Death') return 'Date of Death';
    if (this.selectedCertType === 'Marriage') return 'Date of Marriage';
    return 'Date of Event';
  }

  get counterInfo(): { number: number; label: string } | null {
    if (!this.selectedRegType) return null;
    return this.selectedRegType === 'On Time'
      ? { number: 2, label: 'Counter 2 – On Time Registration' }
      : { number: 1, label: 'Counter 1 – Late / Delayed Registration' };
  }

  onCertTypeChange(type: string) {
    this.selectedCertType = type;
    this.selectedRegType = '';
    this.eventDate = '';
  }

  onEventDateChange() {
    if (!this.eventDate || !this.selectedCertType) {
      this.selectedRegType = '';
      return;
    }

    const event = new Date(this.eventDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    event.setHours(0, 0, 0, 0);

    // Day of event counts as day 1
    const daysDiff = Math.floor((today.getTime() - event.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    if (daysDiff <= 0) {
      this.selectedRegType = '';
      return;
    }

    const threshold = this.selectedCertType === 'Marriage' ? 15 : 30;
    this.selectedRegType = daysDiff <= threshold ? 'On Time' : 'Delayed';
  }

  private requirementsMap: Record<string, RequirementEntry[]> = {

    'Birth|On Time': [
      { section: 'Mandatory Document' },
      { name: 'Duly accomplished and signed Certificate of Live Birth' },
      { section: 'For Unmarried Parents' },
      { name: 'Affidavit of Acknowledgment / Admission of Paternity' },
      { name: 'Affidavit to Use the Surname of the Father (RA 9255)' },
      { name: 'Both parents must be present during registration', note: 'in person' },
      { section: 'Fee Breakdown (Unmarried)' },
      { name: 'Affidavit to Use Surname of Father', copies: '₱300.00' },
      { name: '3 Certifications (₱50.00 each)', copies: '₱150.00' },
      { name: 'UP Law Center (UPLC)', copies: '₱10.00' },
      { section: 'Who May File' },
      { name: 'Hospital Representative, Attendant at Birth, or Parents' },
    ],

    'Birth|Delayed': [
      { section: 'Mandatory Documents' },
      { name: 'Duly accomplished and signed Certificate of Live Birth' },
      { name: 'PSA Certificate of No Registration' },
      { section: 'For Adults (18–59 years old)' },
      { name: 'Any two: Baptismal, Voter\'s Certification, Form 137, SSS E-1, or Passport', note: 'choose 2' },
      { section: 'For Minors (under 18)' },
      { name: 'Baptismal Certificate and School Record (Form 137)' },
      { name: 'Medical Certificate or Immunization Card' },
      { section: 'If Parents are Unmarried' },
      { name: 'Affidavit of Admission of Paternity' },
      { name: 'Affidavit to Use the Surname of the Father (RA 9255)' },
    ],

    'Death|On Time': [
      { section: 'Mandatory Document' },
      { name: 'Duly accomplished and signed Death Certificate (MF 103)' },
      { section: 'Authorized Reporters' },
      { name: 'Physician who last attended the deceased' },
      { name: 'Nearest relative or person with knowledge of the death' },
      { name: 'Funeral Provider' },
      { section: 'Permit Fees' },
      { name: 'Burial Permit', copies: '₱50.00' },
      { name: 'Cremation Permit', copies: '₱500.00' },
      { name: 'Transfer Permit', copies: '₱100.00' },
      { name: 'Disinterment Permit', copies: '₱75.00' },
    ],

    'Death|Delayed': [
      { section: 'Mandatory Documents' },
      { name: 'Duly accomplished and signed Death Certificate Form' },
      { name: 'Resident Certificate / Cedula' },
      { section: 'Less than 1 year from death' },
      { name: 'Official Receipt of Certification from Funeral Parlor' },
      { section: 'More than 1 year from death' },
      { name: 'PSA Certificate of No Registration' },
      { name: 'Official Receipt of Certification from Funeral Parlor' },
    ],

    'Marriage|On Time': [
      { section: 'Mandatory Document' },
      { name: 'Duly accomplished and signed Marriage Certificate (MF 102)' },
      { section: 'Who May File' },
      { name: 'Solemnizing Officer' },
      { name: 'Married couple (husband or wife)' },
      { name: 'Parents' },
    ],

    'Marriage|Delayed': [
      { section: 'Mandatory Document' },
      { name: 'Duly accomplished Marriage Certificate (MF 102)' },
      { section: 'Less than 1 year from marriage' },
      { name: 'Unregistered Marriage Contract (MF 102)', copies: '4 copies' },
      { name: 'PSA Certificate of No Marriage (CENOMAR)' },
      { name: 'Marriage License or Affidavit of Cohabitation' },
      { section: 'More than 1 year from marriage' },
      { name: 'PSA Certificate of No Marriage (CENOMAR)' },
      { name: 'PSA Certificate of No Registration' },
      { name: 'Resident Certificate / Cedula of Informant' },
      { section: 'Service Schedule' },
      { name: 'Monday – Friday', note: '8:00 AM – 5:00 PM (No noon break)' },
    ],
  };

  isSection = isSection;

  getRequirements(): RequirementEntry[] {
    const key = `${this.selectedCertType}|${this.selectedRegType}`;
    return this.requirementsMap[key] ?? [];
  }

  getItemIndex(entries: RequirementEntry[], currentIdx: number): number {
    return entries.slice(0, currentIdx).filter(e => !isSection(e)).length + 1;
  }

  // ================================================================
  // MODAL
  // ================================================================
  showModal(type: 'success' | 'error', message: string) {
    this.modalType = type;
    this.modalMessage = message;
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }

  isWeekend(dateStr: string): boolean {
  const date = new Date(dateStr);
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

onDateChange() {
  this.selectedTime = '';
  if (!this.selectedDate) { this.slots = []; return; }

  if (this.isWeekend(this.selectedDate)) {
    this.selectedDate = '';
    this.slots = [];
    this.showModal('error', 'Appointments are only available Monday to Friday. Please select a weekday.');
    return;
  }

  this.fetchSlots();
}
  fetchSlots() {
    this.loadingSlots = true;
    this.slots = [];
    this.http.get<any[]>(`${this.API}/api/appointments/slots?date=${this.selectedDate}`)
      .subscribe({
        next: (s) => { this.slots = s; this.loadingSlots = false; },
        error: () => {
          this.loadingSlots = false;
          this.showModal('error', 'Failed to load time slots. Please check your connection and try again.');
        }
      });
  }

  selectTime(slot: any) {
    if (slot.full) return;
    this.selectedTime = slot.time;
  }

  // ================================================================
  // BOOKING
  // ================================================================
  bookAppointment() {
    if (!this.selectedDate || !this.selectedTime || !this.selectedCertType || !this.selectedRegType) {
      this.showModal('error', 'Please fill in all fields — certificate type, event date, appointment date, and time slot — before confirming.');
      return;
    }

    this.isBooking = true;

    this.http.post(`${this.API}/api/appointments`, {
      appt_date: this.selectedDate,
      appt_time: this.selectedTime,
      certificate_type: this.selectedCertType,
      registration_type: this.selectedRegType
    }, { headers: { Authorization: `Bearer ${this.token}` } })
    .subscribe({
      next: () => {
        this.isBooking = false;
        this.showModal('success', 'Your appointment has been successfully booked! A confirmation email has been sent to your registered address.');
        this.selectedDate = '';
        this.selectedTime = '';
        this.selectedCertType = '';
        this.selectedRegType = '';
        this.eventDate = '';
        this.slots = [];
      },
      error: (err) => {
        this.isBooking = false;
        this.showModal('error', err.error?.message || 'Failed to book appointment. Please try again or contact the office.');
      }
    });
  }
}
