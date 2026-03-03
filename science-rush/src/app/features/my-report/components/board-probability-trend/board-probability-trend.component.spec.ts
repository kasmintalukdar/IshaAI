import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardProbabilityTrendComponent } from './board-probability-trend.component';

describe('BoardProbabilityTrendComponent', () => {
  let component: BoardProbabilityTrendComponent;
  let fixture: ComponentFixture<BoardProbabilityTrendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardProbabilityTrendComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BoardProbabilityTrendComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
