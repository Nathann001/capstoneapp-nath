import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationOfBirthOnTimeComponent } from './registration-of-birth-on-time.component';

describe('RegistrationOfBirthOnTimeComponent', () => {
  let component: RegistrationOfBirthOnTimeComponent;
  let fixture: ComponentFixture<RegistrationOfBirthOnTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationOfBirthOnTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationOfBirthOnTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
