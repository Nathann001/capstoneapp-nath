import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarriageComponent } from './marriage.component';

describe('MarriageComponent', () => {
  let component: MarriageComponent;
  let fixture: ComponentFixture<MarriageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarriageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarriageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
