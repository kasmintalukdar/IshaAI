import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChapterCompleteModalComponent } from './chapter-complete-modal.component';

describe('ChapterCompleteModalComponent', () => {
  let component: ChapterCompleteModalComponent;
  let fixture: ComponentFixture<ChapterCompleteModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChapterCompleteModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChapterCompleteModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
