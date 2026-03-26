import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ReportService, RootCauseItem } from '../../services/report.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root-cause-analysis',
  templateUrl: './root-cause-analysis.component.html',
  styleUrls: ['./root-cause-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class RootCauseAnalysisComponent implements OnInit {

  rootCauses: RootCauseItem[] = [];
  totalErrors = 0;
  isLoading = true;

  constructor(
    private service: ReportService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.service.getRootCause()
      .pipe(
        finalize(() => {
          this.isLoading = false;
          this.cdr.markForCheck();
        })
      )
      .subscribe(data => {
        if (data) {
          this.rootCauses = data.items;
          this.totalErrors = data.totalErrors;
        }
      });
  }

  getBarWidth(percentage: number): string {
    return `${percentage}%`;
  }
}
