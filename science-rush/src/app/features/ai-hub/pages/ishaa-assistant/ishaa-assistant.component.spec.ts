import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IshaaAssistantComponent } from './ishaa-assistant.component';

describe('IshaaAssistantComponent', () => {
  let component: IshaaAssistantComponent;
  let fixture: ComponentFixture<IshaaAssistantComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IshaaAssistantComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(IshaaAssistantComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
