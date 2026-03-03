import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PremiumPromoCardComponent } from './premium-promo-card.component';

describe('PremiumPromoCardComponent', () => {
  let component: PremiumPromoCardComponent;
  let fixture: ComponentFixture<PremiumPromoCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PremiumPromoCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PremiumPromoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
