import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CognitiveSkillsComponent } from './cognitive-skills.component';

describe('CognitiveSkillsComponent', () => {
  let component: CognitiveSkillsComponent;
  let fixture: ComponentFixture<CognitiveSkillsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CognitiveSkillsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CognitiveSkillsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
