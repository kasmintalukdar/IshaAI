import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameplayRoutingModule } from './gameplay-routing.module';
// Note: We do NOT import GameArenaComponent here because it is loaded by the router 
// and it is Standalone.

@NgModule({
  declarations: [
    // Keep empty. Standalone components don't go here.
  ],
  imports: [
    CommonModule,
    GameplayRoutingModule // <--- This connects to the file above
  ]
})
export class GameplayModule { }