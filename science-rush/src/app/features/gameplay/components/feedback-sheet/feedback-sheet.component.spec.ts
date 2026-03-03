import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FeedbackSheetComponent } from './feedback-sheet.component';

describe('FeedbackSheetComponent', () => {
  let component: FeedbackSheetComponent;
  let fixture: ComponentFixture<FeedbackSheetComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FeedbackSheetComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeedbackSheetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
