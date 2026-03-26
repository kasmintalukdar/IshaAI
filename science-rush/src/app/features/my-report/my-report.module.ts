import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MyReportRoutingModule } from './my-report-routing.module';

import { MyReportPageComponent } from './pages/my-report-page/my-report-page.component';
import { BoardProbabilityTrendComponent } from './components/board-probability-trend/board-probability-trend.component';
import { TopicDiagnosticsComponent } from './components/topic-diagnostics/topic-diagnostics.component';
import { RootCauseAnalysisComponent } from './components/root-cause-analysis/root-cause-analysis.component';
import { CognitiveSkillsComponent } from './components/cognitive-skills/cognitive-skills.component';
import { RetentionHealthComponent } from './components/retention-health/retention-health.component';
import { ChapterWiseAnalysisComponent } from './components/chapter-wise-analysis/chapter-wise-analysis.component';

@NgModule({
  declarations: [
    MyReportPageComponent,
    BoardProbabilityTrendComponent,
    TopicDiagnosticsComponent,
    RootCauseAnalysisComponent,
    CognitiveSkillsComponent,
    RetentionHealthComponent,
    ChapterWiseAnalysisComponent
  ],
  imports: [
    CommonModule,
    HttpClientModule,
    MyReportRoutingModule
  ]
})
export class MyReportModule {}
