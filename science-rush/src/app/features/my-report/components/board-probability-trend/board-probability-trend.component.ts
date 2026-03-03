// import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
// import { Observable } from 'rxjs';
// import { ReportService, BoardTrend } from '../../services/report.service';

// @Component({
//   selector: 'app-board-probability-trend',
//   templateUrl: './board-probability-trend.component.html',
//   styleUrls: ['./board-probability-trend.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   standalone: false // ❌ CRITICAL
// })
// export class BoardProbabilityTrendComponent implements OnInit {
//   trendData$!: Observable<BoardTrend[]>;
//   constructor(private service: ReportService) {}
//   ngOnInit() { this.trendData$ = this.service.getBoardTrend(); }
// }




import { Component, OnInit, ElementRef, ViewChild, HostListener, AfterViewInit } from '@angular/core';
import { ReportService, BoardTrend } from '../../services/report.service';

@Component({
  selector: 'app-board-probability-trend',
  templateUrl: './board-probability-trend.component.html',
  styleUrls: ['./board-probability-trend.component.scss'],
  standalone: false
})
export class BoardProbabilityTrendComponent implements OnInit, AfterViewInit {
  
  trendData: BoardTrend[] = [];
  isLoading = true;

  // Chart Dimensions
  chartWidth = 0;
  chartHeight = 180; // Reduced height to match the compact card in img0001

  // Display Stats
  currentValue: number = 0;
  gainValue: number = 0;
  
  // Bar Data
  bars: { 
    x: number, 
    y: number, 
    height: number, 
    width: number, 
    isCurrent: boolean,
    data: BoardTrend 
  }[] = [];

  @ViewChild('chartContainer') chartContainer!: ElementRef;
  @ViewChild('container') container!: ElementRef;
  // 2. Create a variable to hold the observer
  private resizeObserver: ResizeObserver | null = null;

  constructor(private service: ReportService) {}

  ngOnInit(): void {
    this.service.getBoardTrend().subscribe(data => {
      this.trendData = data.length ? data : this.getMockData();
      this.calculateStats();
      this.isLoading = false;
      setTimeout(() => this.updateChart(), 50);
    });
  }

  

  ngAfterViewInit() {

    this.updateChart();
    // 3. Initialize the Observer
    this.resizeObserver = new ResizeObserver(() => {
      // 4. Whenever the div size changes (or initializes), trigger a window resize
      // This forces the chart library (ECharts/Chart.js) to redraw itself
      window.dispatchEvent(new Event('resize'));
    });

    // 5. Start watching the container
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
      // 1. Current Value (Last item)
      this.currentValue = this.trendData[this.trendData.length - 1].probability;

      // 2. Gain (Current - Previous)
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

    // Layout Configuration matching img0001 (Bars at bottom)
    const margin = { top: 40, right: 10, bottom: 20, left: 10 };
    const width = this.chartWidth - margin.left - margin.right;
    const height = this.chartHeight - margin.top - margin.bottom;
    const maxVal = 100;

    const barWidth = Math.min(32, width / this.trendData.length * 0.7);
    const gap = (width - (barWidth * this.trendData.length)) / (this.trendData.length + 1);

    this.bars = this.trendData.map((d, i) => {
      const h = (d.probability / maxVal) * height;
      const isLast = i === this.trendData.length - 1;

      return {
        x: margin.left + gap + (i * (barWidth + gap)),
        y: margin.top + height - h,
        height: h,
        width: barWidth,
        isCurrent: isLast, // Mark the last bar to be Green
        data: d
      };
    });
  }

  getMockData(): BoardTrend[] {
    return [
      { weekLabel: 'W1', date: '', probability: 30 },
      { weekLabel: 'W2', date: '', probability: 45 },
      { weekLabel: 'W3', date: '', probability: 40 },
      { weekLabel: 'W4', date: '', probability: 60 },
      { weekLabel: 'W5', date: '', probability: 85 } // High active bar
    ];
  }

  ngOnDestroy() {
    // 6. CLEANUP: Very important for production to prevent memory leaks
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  
}