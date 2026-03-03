import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { SubjectPathRoutingModule } from './subject-path-routing.module';
// Note: We do NOT declare PathViewComponent here because it is Standalone.

@NgModule({
  imports: [
    CommonModule,
    SubjectPathRoutingModule
  ]
})
export class SubjectPathModule { }