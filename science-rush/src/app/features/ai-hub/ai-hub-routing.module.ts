// src/app/features/ai-hub/ai-hub-routing.module.ts
import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiDashboardComponent } from './pages/ai-dashboard/ai-dashboard.component';
import { AiTutorComponent } from './pages/ai-tutor/ai-tutor.component';

const routes: Routes = [
  { path: 'tutor', component: AiTutorComponent },
  { path: '', component: AiDashboardComponent }, // Default page for /ai-hub
  { path: 'tutor-strategy', component: AiTutorComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AiHubRoutingModule { }