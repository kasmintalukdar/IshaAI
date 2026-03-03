import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathViewComponent } from './path-view.component';

describe('PathViewComponent', () => {
  let component: PathViewComponent;
  let fixture: ComponentFixture<PathViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PathViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
