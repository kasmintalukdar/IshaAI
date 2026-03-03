import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

// Components
import { AdminLayoutComponent } from './admin-layout.component';
import { StreamManagerComponent } from './pages/stream-manager/stream-manager.component';
import { SubjectManagerComponent } from './pages/subject-manager/subject-manager.component';
import { ChapterWizardComponent } from './pages/chapter-wizard/chapter-wizard.component';
import { JsonValidatorComponent } from './components/json-validator/json-validator.component';

// Shared
import { SharedModule } from '@shared/shared.module'; // Assuming you have Button/Popup

const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'streams', pathMatch: 'full' },
      { path: 'streams', component: StreamManagerComponent },
      { path: 'subjects', component: SubjectManagerComponent },
      { path: 'chapters/new', component: ChapterWizardComponent }
    ]
  }
];

@NgModule({
  declarations: [
    AdminLayoutComponent,
    StreamManagerComponent,
    SubjectManagerComponent,
    ChapterWizardComponent,
    JsonValidatorComponent
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    FormsModule,
    SharedModule,
    RouterModule.forChild(routes)
  ]
})
export class AdminModule { }