import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { MyReportRoutingModule } from './my-report-routing.module';

// Import All Components
import { MyReportPageComponent } from './pages/my-report-page/my-report-page.component';
import { BoardProbabilityTrendComponent } from './components/board-probability-trend/board-probability-trend.component';
import { TopicDiagnosticsComponent } from './components/topic-diagnostics/topic-diagnostics.component';
import { RootCauseAnalysisComponent } from './components/root-cause-analysis/root-cause-analysis.component';
import { CognitiveSkillsComponent } from './components/cognitive-skills/cognitive-skills.component';
import { RetentionHealthComponent } from './components/retention-health/retention-health.component';
import { PremiumLockComponent } from '@shared/components/premium-lock/premium-lock.component';
import { UpgradeModalComponent } from '@shared/components/upgrade-modal/upgrade-modal.component';
import { ChapterWiseAnalysisComponent } from './components/chapter-wise-analysis/chapter-wise-analysis.component';

@NgModule({
  declarations: [
    // ✅ 1. Declare all components here so they are available to the module
    MyReportPageComponent,
    BoardProbabilityTrendComponent,
    TopicDiagnosticsComponent,
    RootCauseAnalysisComponent,
    CognitiveSkillsComponent,
    RetentionHealthComponent,
    PremiumLockComponent,
    ChapterWiseAnalysisComponent
    
  ],
  imports: [
    // ✅ 2. Import standard Angular modules
    CommonModule,      // Required for *ngIf, *ngFor
    HttpClientModule,  // Required for API calls
    MyReportRoutingModule,
    UpgradeModalComponent
  ]
})
export class MyReportModule { }