import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { DashboardHomeComponent } from './pages/dashboard-home/dashboard-home.component';
import { SubjectCardComponent } from './components/subject-card/subject-card.component';
import { SharedModule } from '../../shared/shared.module';
import { UpgradeModalComponent } from '@shared/components/upgrade-modal/upgrade-modal.component';


@NgModule({
  declarations: [
    // Leave empty or remove this array entirely
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    SharedModule,
    DashboardHomeComponent, // <--- MOVED HERE (Imported, not declared)
    SubjectCardComponent,
    UpgradeModalComponent    // <--- MOVED HERE
  ]
})
export class DashboardModule { }