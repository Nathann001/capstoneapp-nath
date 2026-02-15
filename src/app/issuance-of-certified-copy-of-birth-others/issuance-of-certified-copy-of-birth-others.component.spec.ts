import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IssuanceOfCertifiedCopyOfBirthOthersComponent } from './issuance-of-certified-copy-of-birth-others.component';

describe('IssuanceOfCertifiedCopyOfBirthOthersComponent', () => {
  let component: IssuanceOfCertifiedCopyOfBirthOthersComponent;
  let fixture: ComponentFixture<IssuanceOfCertifiedCopyOfBirthOthersComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IssuanceOfCertifiedCopyOfBirthOthersComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IssuanceOfCertifiedCopyOfBirthOthersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
