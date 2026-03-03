import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyReportPageComponent } from './my-report-page.component';

describe('MyReportPageComponent', () => {
  let component: MyReportPageComponent;
  let fixture: ComponentFixture<MyReportPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyReportPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyReportPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
