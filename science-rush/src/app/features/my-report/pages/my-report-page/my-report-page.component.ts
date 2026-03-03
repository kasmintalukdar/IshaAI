import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-my-report-page',
  templateUrl: './my-report-page.component.html',
  styleUrls: ['./my-report-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // <--- ADD THIS LINE
})
export class MyReportPageComponent {
  showUpgradeModal = false
}