import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremiumLockComponent } from './premium-lock.component';

describe('PremiumLockComponent', () => {
  let component: PremiumLockComponent;
  let fixture: ComponentFixture<PremiumLockComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumLockComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PremiumLockComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
