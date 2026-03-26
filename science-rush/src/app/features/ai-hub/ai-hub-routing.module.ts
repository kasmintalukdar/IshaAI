import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AiTutorComponent } from './pages/ai-tutor/ai-tutor.component';

const routes: Routes = [
  { path: 'tutor', component: AiTutorComponent },
  { path: 'tutor-strategy', component: AiTutorComponent },
  // AI dashboard and ishaa-v2 removed — KPIs merged into /my-report
  { path: '', redirectTo: '/my-report', pathMatch: 'full' },
  { path: 'ishaa-v2', redirectTo: '/my-report', pathMatch: 'full' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AiHubRoutingModule {}
