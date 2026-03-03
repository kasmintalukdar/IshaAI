import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RetentionHealthComponent } from './retention-health.component';

describe('RetentionHealthComponent', () => {
  let component: RetentionHealthComponent;
  let fixture: ComponentFixture<RetentionHealthComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RetentionHealthComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RetentionHealthComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
