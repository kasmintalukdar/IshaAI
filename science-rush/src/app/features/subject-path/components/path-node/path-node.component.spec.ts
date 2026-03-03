import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PathNodeComponent } from './path-node.component';

describe('PathNodeComponent', () => {
  let component: PathNodeComponent;
  let fixture: ComponentFixture<PathNodeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PathNodeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PathNodeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
