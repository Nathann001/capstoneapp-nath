// ================================================================
// appointment-booking.component.ts  (REDESIGNED)
// ================================================================
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';

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
  minDate: string = '';

  certificateTypes = ['Birth', 'Death', 'Marriage'];
  registrationTypes = ['On Time', 'Delayed'];

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
  }

  get token() { return localStorage.getItem('token') || ''; }

  showModal(type: 'success' | 'error', message: string) {
    this.modalType = type;
    this.modalMessage = message;
    this.modalVisible = true;
  }

  closeModal() {
    this.modalVisible = false;
  }

  onDateChange() {
    this.selectedTime = '';
    if (!this.selectedDate) { this.slots = []; return; }
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

  bookAppointment() {
    if (!this.selectedDate || !this.selectedTime || !this.selectedCertType || !this.selectedRegType) {
      this.showModal('error', 'Please fill in all fields — certificate type, registration type, date, and time slot — before confirming.');
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
        // Reset form
        this.selectedDate = '';
        this.selectedTime = '';
        this.selectedCertType = '';
        this.selectedRegType = '';
        this.slots = [];
      },
      error: (err) => {
        this.isBooking = false;
        this.showModal('error', err.error?.message || 'Failed to book appointment. Please try again or contact the office.');
      }
    });
  }
}