import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyProfileComponent } from './pages/my-profile/my-profile.component';

const routes: Routes = [
  { path: '', component: MyProfileComponent, pathMatch: 'full' },
  { 
    path: 'feedback', 
    loadComponent: () => import('../feedback/feedback.component')
      .then(m => m.FeedbackComponent) 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ProfileRoutingModule { }