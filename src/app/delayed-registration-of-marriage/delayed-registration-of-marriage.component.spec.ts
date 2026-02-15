import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DelayedRegistrationOfMarriageComponent } from './delayed-registration-of-marriage.component';

describe('DelayedRegistrationOfMarriageComponent', () => {
  let component: DelayedRegistrationOfMarriageComponent;
  let fixture: ComponentFixture<DelayedRegistrationOfMarriageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DelayedRegistrationOfMarriageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DelayedRegistrationOfMarriageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
