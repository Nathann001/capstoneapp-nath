import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelayedRegistrationOfBirthComponent } from './delayed-registration-of-birth.component';

describe('DelayedRegistrationOfBirthComponent', () => {
  let component: DelayedRegistrationOfBirthComponent;
  let fixture: ComponentFixture<DelayedRegistrationOfBirthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DelayedRegistrationOfBirthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelayedRegistrationOfBirthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
