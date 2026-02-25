import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Birthontime } from './birthontime';

describe('Birthontime', () => {
  let component: Birthontime;
  let fixture: ComponentFixture<Birthontime>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Birthontime]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Birthontime);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
