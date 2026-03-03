import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PromotionAnimComponent } from './promotion-anim.component';

describe('PromotionAnimComponent', () => {
  let component: PromotionAnimComponent;
  let fixture: ComponentFixture<PromotionAnimComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PromotionAnimComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PromotionAnimComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
