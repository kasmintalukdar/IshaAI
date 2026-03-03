import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameArenaComponent } from './game-arena.component';

describe('GameArenaComponent', () => {
  let component: GameArenaComponent;
  let fixture: ComponentFixture<GameArenaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameArenaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GameArenaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
