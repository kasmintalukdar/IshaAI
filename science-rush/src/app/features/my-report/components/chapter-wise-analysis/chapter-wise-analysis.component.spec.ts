import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterWiseAnalysisComponent } from './chapter-wise-analysis.component';

describe('ChapterWiseAnalysisComponent', () => {
  let component: ChapterWiseAnalysisComponent;
  let fixture: ComponentFixture<ChapterWiseAnalysisComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterWiseAnalysisComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChapterWiseAnalysisComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
