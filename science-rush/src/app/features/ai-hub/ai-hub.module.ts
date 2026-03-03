import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AiHubRoutingModule } from './ai-hub-routing.module';
import { AiDashboardComponent } from './pages/ai-dashboard/ai-dashboard.component'; // Import it

@NgModule({
  declarations: [
    // ❌ REMOVE AiDashboardComponent from here
  ],
  imports: [
    CommonModule,
    AiHubRoutingModule,
    AiDashboardComponent // ✅ ADD it here (Importing the standalone component)
  ]
})
export class AiHubModule { }