import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { GameArenaComponent } from './pages/game-arena/game-arena.component';

const routes: Routes = [
  { path: 'play', component: GameArenaComponent },
  { path: ':id', component: GameArenaComponent } // e.g. /play/c1
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class GameplayRoutingModule { } // <--- MUST SAY 'export class'