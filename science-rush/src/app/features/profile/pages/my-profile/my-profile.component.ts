import { Component, ChangeDetectionStrategy } from '@angular/core';


@Component({
  selector: 'app-my-profile',
  templateUrl: './my-profile.component.html',
  styleUrls: ['./my-profile.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false 
})
export class MyProfileComponent {}