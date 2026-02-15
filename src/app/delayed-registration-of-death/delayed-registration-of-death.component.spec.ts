import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelayedRegistrationOfDeathComponent } from './delayed-registration-of-death.component';

describe('DelayedRegistrationOfDeathComponent', () => {
  let component: DelayedRegistrationOfDeathComponent;
  let fixture: ComponentFixture<DelayedRegistrationOfDeathComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DelayedRegistrationOfDeathComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelayedRegistrationOfDeathComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
