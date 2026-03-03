import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthRoutingModule } from './auth-routing.module';
// Note: We do NOT declare LoginComponent because it is Standalone.

@NgModule({
  imports: [
    CommonModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }