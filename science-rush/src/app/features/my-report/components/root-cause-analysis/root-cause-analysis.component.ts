// import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
// import { Observable } from 'rxjs';
// import { ReportService, RootCause } from '../../services/report.service';

// @Component({
//   selector: 'app-root-cause-analysis',
//   templateUrl: './root-cause-analysis.component.html',
//   styleUrls: ['./root-cause-analysis.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   standalone: false // ❌ CRITICAL
// })
// export class RootCauseAnalysisComponent implements OnInit {
//   rca$!: Observable<RootCause | null>;
//   constructor(private service: ReportService) {}
//   ngOnInit() { this.rca$ = this.service.getRootCause(); }



import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ReportService, RootCause, RootCauseItem } from '../../services/report.service';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-root-cause-analysis',
  templateUrl: './root-cause-analysis.component.html',
  styleUrls: ['./root-cause-analysis.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class RootCauseAnalysisComponent implements OnInit {
  
  // Data for the view
  rootCauses: RootCauseItem[] = [];
  totalErrors: number = 0;
  isLoading: boolean = true;

  constructor(
    private service: ReportService,
    private cdr: ChangeDetectorRef // Needed for manual update with OnPush
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

  // Helper to calculate bar width dynamically
  getBarWidth(percentage: number): string {
    return `${percentage}%`;
  }
}