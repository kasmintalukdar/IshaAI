import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyReportPageComponent } from './pages/my-report-page/my-report-page.component';

const routes: Routes = [
  { path: '', component: MyReportPageComponent }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class MyReportRoutingModule { }