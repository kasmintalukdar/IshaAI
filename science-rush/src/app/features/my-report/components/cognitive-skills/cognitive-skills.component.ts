// import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
// import { Observable } from 'rxjs';
// import { ReportService, CognitiveSkill } from '../../services/report.service';

// @Component({
//   selector: 'app-cognitive-skills',
//   templateUrl: './cognitive-skills.component.html',
//   styleUrls: ['./cognitive-skills.component.scss'],
//   changeDetection: ChangeDetectionStrategy.OnPush,
//   standalone: false // ❌ CRITICAL
// })
// export class CognitiveSkillsComponent implements OnInit {
//   skills$!: Observable<CognitiveSkill[]>;
//   constructor(private service: ReportService) {}
//   ngOnInit() { this.skills$ = this.service.getCognitiveSkills(); }
//   getColor(pct: number): string {
//     if (pct > 75) return '#2ecc71';
//     if (pct > 50) return '#3498db';
//     return '#e67e22';
//   }
// }





import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportService, CognitiveSkill } from '../../services/report.service';

@Component({
  selector: 'app-cognitive-skills',
  templateUrl: './cognitive-skills.component.html',
  styleUrls: ['./cognitive-skills.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false 
})
export class CognitiveSkillsComponent implements OnInit {
  skills$!: Observable<CognitiveSkill[]>;

  constructor(private service: ReportService) {}

  ngOnInit() {
    this.skills$ = this.service.getCognitiveSkills();
  }

  getColor(pct: number | undefined | null): string {
    const score = pct || 0;
    if (score >= 75) return '#2ecc71'; 
    if (score >= 50) return '#3498db'; 
    if (score >= 25) return '#f1c40f'; 
    return '#e74c3c'; 
  }
}