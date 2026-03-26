import { Component, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, HostListener } from '@angular/core';
import { ReportService, RetentionHealth } from '../../services/report.service';

@Component({
  selector: 'app-retention-health',
  templateUrl: './retention-health.component.html',
  styleUrls: ['./retention-health.component.scss'],
  standalone: false
})
export class RetentionHealthComponent implements OnInit, AfterViewInit, OnDestroy {

  data: RetentionHealth | null = null;
  isLoading = true;

  chartWidth = 0;
  chartHeight = 220;

  curvePath = '';
  startPoint = { x: 0, y: 0 };
  endPoint = { x: 0, y: 0 };
  todayPoint = { x: 0, y: 0 };
  retentionPercent = 0;

  @ViewChild('chartContainer') chartContainer!: ElementRef;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private service: ReportService) {}

  ngOnInit(): void {
    this.service.getRetentionHealth().subscribe(res => {
      this.data = res;
      this.retentionPercent = this.data?.overallRetention || 0;
      this.isLoading = false;
      if (this.data?.hasData) {
        setTimeout(() => this.drawChart(), 50);
      }
    });
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => this.drawChart());
    if (this.chartContainer) {
      this.resizeObserver.observe(this.chartContainer.nativeElement);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.drawChart();
  }

  drawChart() {
    if (!this.chartContainer || !this.data?.hasData) return;
    const el = this.chartContainer.nativeElement;
    this.chartWidth = el.offsetWidth;

    const margin = { top: 30, right: 30, bottom: 40, left: 30 };
    const w = this.chartWidth - margin.left - margin.right;

    this.startPoint = { x: margin.left, y: margin.top };
    this.endPoint = { x: this.chartWidth - margin.right, y: this.chartHeight - margin.bottom };

    const controlPoint = {
      x: margin.left + (w * 0.2),
      y: this.endPoint.y
    };

    this.curvePath = `M ${this.startPoint.x} ${this.startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${this.endPoint.x} ${this.endPoint.y}`;

    const t = 1 - (this.retentionPercent / 100);
    const mt = 1 - t;
    this.todayPoint = {
      x: (mt * mt * this.startPoint.x) + (2 * mt * t * controlPoint.x) + (t * t * this.endPoint.x),
      y: (mt * mt * this.startPoint.y) + (2 * mt * t * controlPoint.y) + (t * t * this.endPoint.y)
    };
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
