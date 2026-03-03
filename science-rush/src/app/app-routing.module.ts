import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { guestGuard } from './core/guards/auth.guard'; // ✅ Correct functional guard import

const routes: Routes = [

  { 
    path: 'profile', 
    loadChildren: () => import('./features/profile/profile.module').then(m => m.ProfileModule),
    canActivate: [guestGuard]
  },



  // { 
  //   path: 'ai-hub', 
  //   // Point this to your actual component or module
  //   loadComponent: () => import('./features/subject-path/pages/path-view/path-view.component').then(m => m.PathViewComponent),
  //   canActivate: [guestGuard]
  // },
  { 
    path: 'gameplay', 
    loadChildren: () => import('./features/gameplay/gameplay.module').then(m => m.GameplayModule) 
  },

  // 🔴 ADD THIS: Leaderboard Route
  { 
    path: 'leaderboard', 
    // Point this to your actual component or module
    loadComponent: () => import('./features/gameplay/pages/game-arena/game-arena.component').then(m => m.GameArenaComponent),
    canActivate: [guestGuard]
  },

  // 1. Default Redirect
  { 
    path: '', 
    redirectTo: 'dashboard', 
    pathMatch: 'full' 
  },


  // 2. Auth Routes
  { 
    path: 'auth/login', 
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: 'auth/signup', 
    loadComponent: () => import('./features/auth/pages/signup/signup.component').then(m => m.SignupComponent) 
  },

  // 3. Dashboard (Protected)
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent),
    canActivate: [guestGuard]
  },

  {
    path: 'ai-hub',
    loadChildren: () => import('./features/ai-hub/ai-hub.module').then(m => m.AiHubModule)
  },

  { 
    path: 'my-report', 
    loadChildren: () => import('./features/my-report/my-report.module').then(m => m.MyReportModule),
    canActivate: [guestGuard]
  },
  

  // 🔴 CRITICAL: SPECIFIC TOPIC ROUTE MUST BE FIRST
  // This handles /path/chapter/123 (Topic Zig-Zag)
  // If this is below the next route, Angular will treat "chapter" as an ID and break.
  { 
    path: 'path/chapter/:chapterId', 
    loadComponent: () => import('./features/subject-path/pages/topic-path-view/topic-path-view.component').then(m => m.TopicPathViewComponent),
    canActivate: [guestGuard]
  },

  // 🟢 GENERIC SUBJECT ROUTE SECOND
  // This handles /path/Physics (Subject Zig-Zag)
  { 
    path: 'path/:id', 
    loadComponent: () => import('./features/subject-path/pages/path-view/path-view.component').then(m => m.PathViewComponent),
    canActivate: [guestGuard]
  },

  // 4. Game Arena (Protected)
  { 
    path: 'game/:id', 
    loadComponent: () => import('./features/gameplay/pages/game-arena/game-arena.component').then(m => m.GameArenaComponent),
    canActivate: [guestGuard]
  },


  // 5. Wildcard (404 Fallback)
  { 
    path: '**', 
    redirectTo: 'dashboard' 
  },
 
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }