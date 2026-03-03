// src/app/features/ai-hub/ai-hub-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiDashboardComponent } from './pages/ai-dashboard/ai-dashboard.component';
import { AiTutorComponent } from './pages/ai-tutor/ai-tutor.component';
import { IshaaAssistantComponent } from './pages/ishaa-assistant/ishaa-assistant.component';

const routes: Routes = [
  { path: 'tutor', component: AiTutorComponent },
  { path: '', component: AiDashboardComponent }, // Default page for /ai-hub
  { path: 'tutor-strategy', component: AiTutorComponent },
  {
  path: 'ishaa-v2',
  component: IshaaAssistantComponent
}
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AiHubRoutingModule {

 }