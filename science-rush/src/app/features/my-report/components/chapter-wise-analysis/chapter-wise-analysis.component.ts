import { Component, OnInit, ElementRef, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ReportService, ChapterAnalysis } from '../../services/report.service';

@Component({
  selector: 'app-chapter-wise-analysis',
  templateUrl: './chapter-wise-analysis.component.html',
  styleUrls: ['./chapter-wise-analysis.component.scss'],
  standalone: false
})
export class ChapterWiseAnalysisComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('chapterContainer') chapterContainer!: ElementRef;
  private resizeObserver: ResizeObserver | null = null;

  allData: ChapterAnalysis[] = [];
  subjects: string[] = [];
  filteredChapters: ChapterAnalysis[] = [];

  selectedSubject = '';
  selectedChapter: ChapterAnalysis | null = null;

  isLoading = true;

  constructor(private service: ReportService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.service.getChapterAnalysis().subscribe(data => {
      this.allData = data || [];
      this.subjects = [...new Set(this.allData.map(item => item.subjectName))];

      if (this.subjects.length > 0) {
        this.selectedSubject = this.subjects[0];
        this.filterChapters();
      }

      this.isLoading = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
    });
  }

  ngAfterViewInit() {
    this.resizeObserver = new ResizeObserver(() => {
      window.dispatchEvent(new Event('resize'));
    });
    if (this.chapterContainer) {
      this.resizeObserver.observe(this.chapterContainer.nativeElement);
    }
  }

  onSubjectChange(event: any): void {
    this.selectedSubject = event.target.value;
    this.filterChapters();
  }

  onChapterChange(event: any): void {
    const chapterName = event.target.value;
    this.selectedChapter = this.filteredChapters.find(c => c._id === chapterName) || null;
  }

  private filterChapters(): void {
    this.filteredChapters = this.allData.filter(
      item => item.subjectName === this.selectedSubject
    );
    this.selectedChapter = this.filteredChapters.length > 0 ? this.filteredChapters[0] : null;
  }

  getStatusColor(accuracy: number): string {
    if (accuracy < 50) return '#F87171';
    if (accuracy < 80) return '#FBBF24';
    return '#34D399';
  }

  getBadgeClass(accuracy: number): string {
    if (accuracy < 50) return 'badge-weak';
    if (accuracy < 80) return 'badge-avg';
    return 'badge-strong';
  }

  getRcPercent(val: number | undefined): number {
    if (!val) return 0;
    return Math.min((val / 10) * 100, 100);
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }
}
