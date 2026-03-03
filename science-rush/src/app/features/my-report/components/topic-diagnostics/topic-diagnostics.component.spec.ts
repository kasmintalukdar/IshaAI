import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopicDiagnosticsComponent } from './topic-diagnostics.component';

describe('TopicDiagnosticsComponent', () => {
  let component: TopicDiagnosticsComponent;
  let fixture: ComponentFixture<TopicDiagnosticsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopicDiagnosticsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopicDiagnosticsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
