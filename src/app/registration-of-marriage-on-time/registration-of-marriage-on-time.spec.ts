import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationOfMarriageOnTime } from './registration-of-marriage-on-time';

describe('RegistrationOfMarriageOnTime', () => {
  let component: RegistrationOfMarriageOnTime;
  let fixture: ComponentFixture<RegistrationOfMarriageOnTime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationOfMarriageOnTime]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationOfMarriageOnTime);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
