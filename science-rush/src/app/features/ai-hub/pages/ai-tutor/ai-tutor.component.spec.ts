import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiTutorComponent } from './ai-tutor.component';

describe('AiTutorComponent', () => {
  let component: AiTutorComponent;
  let fixture: ComponentFixture<AiTutorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiTutorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiTutorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
