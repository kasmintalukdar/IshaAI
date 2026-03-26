import { Component, OnInit, OnDestroy, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { ReportService, BoardTrend } from '../../services/report.service';

@Component({
  selector: 'app-board-probability-trend',
  templateUrl: './board-probability-trend.component.html',
  styleUrls: ['./board-probability-trend.component.scss'],
  standalone: false
})
export class BoardProbabilityTrendComponent implements OnInit, AfterViewInit, OnDestroy {

  trendData: BoardTrend[] = [];
  isLoading = true;
  hasData = false;

  chartWidth = 0;
  chartHeight = 180;

  currentValue = 0;
  gainValue = 0;

  bars: {
    x: number;
    y: number;
    height: number;
    width: number;
    isCurrent: boolean;
    data: BoardTrend;
  }[] = [];

  @ViewChild('chartContainer') chartContainer!: ElementRef;
  @ViewChild('container') container!: ElementRef;
  private resizeObserver: ResizeObserver | null = null;

  constructor(private service: ReportService) {}

  ngOnInit(): void {
    this.service.getBoardTrend().subscribe(data => {
      this.trendData = data || [];
      this.hasData = this.trendData.length > 0;
      if (this.hasData) {
        this.calculateStats();
      }
      this.isLoading = false;
      setTimeout(() => this.updateChart(), 50);
    });
  }

  ngAfterViewInit() {
    this.updateChart();
    this.resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    if (this.container) {
      this.resizeObserver.observe(this.container.nativeElement);
    }
  }

  @HostListener('window:resize')
  onResize() {
    this.updateChart();
  }

  calculateStats() {
    if (this.trendData.length > 0) {
      this.currentValue = this.trendData[this.trendData.length - 1].probability;
      if (this.trendData.length > 1) {
        const prev = this.trendData[this.trendData.length - 2].probability;
        this.gainValue = this.currentValue - prev;
      }
    }
  }

  updateChart() {
    if (!this.chartContainer) return;

    const element = this.chartContainer.nativeElement;
    this.chartWidth = element.offsetWidth;

    const margin = { top: 40, right: 10, bottom: 20, left: 10 };
    const width = this.chartWidth - margin.left - margin.right;
    const height = this.chartHeight - margin.top - margin.bottom;
    const maxVal = 100;

    const barWidth = Math.min(32, width / this.trendData.length * 0.7);
    const gap = (width - (barWidth * this.trendData.length)) / (this.trendData.length + 1);

    this.bars = this.trendData.map((d, i) => {
      const h = (d.probability / maxVal) * height;
      return {
        x: margin.left + gap + (i * (barWidth + gap)),
        y: margin.top + height - h,
        height: h,
        width: barWidth,
        isCurrent: i === this.trendData.length - 1,
        data: d
      };
    });
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
