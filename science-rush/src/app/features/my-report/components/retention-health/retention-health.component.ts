// import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
// import { Observable } from 'rxjs';
// import { ReportService, RetentionHealth } from '../../services/report.service';

// @Component({
//   selector: 'app-retention-health',
//   templateUrl: './retention-health.component.html',
//   styleUrls: ['./retention-health.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   standalone: false 
// })
// export class RetentionHealthComponent implements OnInit {
  
//   health$!: Observable<RetentionHealth | null>;

//   @Output() requestUpgrade = new EventEmitter<void>();

//   onUnlockClicked() {
//     this.requestUpgrade.emit();
//   }

//   constructor(private service: ReportService) {}
//   ngOnInit() { this.health$ = this.service.getRetentionHealth(); }
//   getGradient(pct: number): string {
//     const color = pct > 70 ? '#2ecc71' : (pct > 40 ? '#f1c40f' : '#e74c3c');
//     return `conic-gradient(${color} ${pct}%, #ecf0f1 0)`;
//   }
// }

import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { ReportService, RetentionHealth } from '../../services/report.service';

@Component({
  selector: 'app-retention-health',
  templateUrl: './retention-health.component.html',
  styleUrls: ['./retention-health.component.scss'],
  standalone: false
})
export class RetentionHealthComponent implements OnInit, AfterViewInit {

  data: RetentionHealth | null = null;
  isLoading = true;

  // Chart Config
  chartWidth = 0;
  chartHeight = 220;
  
  // Curve Points
  curvePath: string = '';
  startPoint = { x: 0, y: 0 };
  endPoint = { x: 0, y: 0 };
  
  // "Today" Point Logic
  todayPoint = { x: 0, y: 0 };
  retentionPercent = 50; // Default fallback

  @ViewChild('chartContainer') chartContainer!: ElementRef;

  constructor(private service: ReportService) {}

  ngOnInit(): void {
    this.service.getRetentionHealth().subscribe(res => {
      this.data = res || this.getMockData();
      this.retentionPercent = this.data.overallRetention || 50;
      this.isLoading = false;
      setTimeout(() => this.drawChart(), 50);
    });
  }

  ngAfterViewInit() {
    this.drawChart();
  }

  @HostListener('window:resize')
  onResize() {
    this.drawChart();
  }

  drawChart() {
    if (!this.chartContainer) return;
    const el = this.chartContainer.nativeElement;
    this.chartWidth = el.offsetWidth;

    const margin = { top: 30, right: 30, bottom: 40, left: 30 };
    const w = this.chartWidth - margin.left - margin.right;
    const h = this.chartHeight - margin.top - margin.bottom;

    // 1. Define Start (100% Retention) and End (Danger Zone ~30%)
    this.startPoint = { x: margin.left, y: margin.top }; // Top Left
    this.endPoint = { x: this.chartWidth - margin.right, y: this.chartHeight - margin.bottom }; // Bottom Right

    // 2. Control Point for the Curve (Bottom-Left bias creates the "decay" shape)
    const controlPoint = { 
      x: margin.left + (w * 0.2), 
      y: this.endPoint.y 
    };

    // 3. Generate Path String (Quadratic Bezier)
    this.curvePath = `M ${this.startPoint.x} ${this.startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${this.endPoint.x} ${this.endPoint.y}`;

    // 4. Calculate "Today's" Position on the curve
    // We approximate t based on retention (100% -> 0, 0% -> 1)
    // Inverting logic: Higher retention = lower t (closer to start)
    const t = 1 - (this.retentionPercent / 100); 
    
    // Quadratic Bezier Formula to find (x,y) at t
    // B(t) = (1-t)^2 * P0 + 2(1-t)t * P1 + t^2 * P2
    const mt = 1 - t;
    this.todayPoint = {
      x: (mt * mt * this.startPoint.x) + (2 * mt * t * controlPoint.x) + (t * t * this.endPoint.x),
      y: (mt * mt * this.startPoint.y) + (2 * mt * t * controlPoint.y) + (t * t * this.endPoint.y)
    };
  }

  getMockData(): RetentionHealth {
    return {
      overallRetention: 50,
      hasData: true,
      healthStatus: 'Average',
      insight: 'Topic "Optics" is entering the Forgot Zone (< 40%).'
    };
  }
}