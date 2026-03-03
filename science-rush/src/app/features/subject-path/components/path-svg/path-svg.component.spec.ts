import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathSvgComponent } from './path-svg.component';

describe('PathSvgComponent', () => {
  let component: PathSvgComponent;
  let fixture: ComponentFixture<PathSvgComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathSvgComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PathSvgComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
