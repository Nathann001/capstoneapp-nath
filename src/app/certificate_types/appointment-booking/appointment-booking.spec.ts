import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AppointmentBooking } from './appointment-booking';

describe('AppointmentBooking', () => {
  let component: AppointmentBooking;
  let fixture: ComponentFixture<AppointmentBooking>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppointmentBooking]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AppointmentBooking);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
