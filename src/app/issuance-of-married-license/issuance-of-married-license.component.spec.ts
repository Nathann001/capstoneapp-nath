import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuanceOfMarriedLicenseComponent } from './issuance-of-married-license.component';

describe('IssuanceOfMarriedLicenseComponent', () => {
  let component: IssuanceOfMarriedLicenseComponent;
  let fixture: ComponentFixture<IssuanceOfMarriedLicenseComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuanceOfMarriedLicenseComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssuanceOfMarriedLicenseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
