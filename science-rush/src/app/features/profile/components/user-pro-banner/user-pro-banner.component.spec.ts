import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UserProBannerComponent } from './user-pro-banner.component';

describe('UserProBannerComponent', () => {
  let component: UserProBannerComponent;
  let fixture: ComponentFixture<UserProBannerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UserProBannerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UserProBannerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
