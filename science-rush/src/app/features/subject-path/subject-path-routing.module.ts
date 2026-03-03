import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { PathViewComponent } from './pages/path-view/path-view.component';

const routes: Routes = [
  // The ':id' tells Angular this part of the URL is dynamic (e.g., sub_phy, sub_chem)
  { path: ':id', component: PathViewComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class SubjectPathRoutingModule { }