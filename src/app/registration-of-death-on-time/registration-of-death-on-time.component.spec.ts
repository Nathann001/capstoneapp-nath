import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationOfDeathOnTimeComponent } from './registration-of-death-on-time.component';

describe('RegistrationOfDeathOnTimeComponent', () => {
  let component: RegistrationOfDeathOnTimeComponent;
  let fixture: ComponentFixture<RegistrationOfDeathOnTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationOfDeathOnTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationOfDeathOnTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
