import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicPathViewComponent } from './topic-path-view.component';

describe('TopicPathViewComponent', () => {
  let component: TopicPathViewComponent;
  let fixture: ComponentFixture<TopicPathViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicPathViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicPathViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
