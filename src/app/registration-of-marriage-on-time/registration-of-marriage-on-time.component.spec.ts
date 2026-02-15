import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegistrationOfMarriageOnTimeComponent } from './registration-of-marriage-on-time.component';

describe('RegistrationOfMarriageOnTimeComponent', () => {
  let component: RegistrationOfMarriageOnTimeComponent;
  let fixture: ComponentFixture<RegistrationOfMarriageOnTimeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegistrationOfMarriageOnTimeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegistrationOfMarriageOnTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
