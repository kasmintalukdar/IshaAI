import { Routes } from '@angular/router';
import { guestGuard } from './core/guards/auth.guard'; // 🟢 Import the corrected guard
import { GuestGuard } from './core/guards/guest.guard'; 

export const routes: Routes = [
  // 1. Redirect root to Login
  { 
    path: '', 
    redirectTo: 'auth/login', 
    pathMatch: 'full' 
  },

  // 2. Auth Pages (Only for Guests)
  { 
    path: 'auth/login', 
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent),
    canActivate: [GuestGuard] 
  },
  { 
    path: 'auth/signup', 
    loadComponent: () => import('./features/auth/pages/signup/signup.component').then(m => m.SignupComponent),
    canActivate: [GuestGuard]
  },

  // 3. Protected Pages (Only for Logged In Users)
  // 🟢 FIX: Use 'authGuard' here, NOT 'guestGuard'
  { 
    path: 'dashboard', 
    loadComponent: () => import('./features/dashboard/pages/dashboard-home/dashboard-home.component').then(m => m.DashboardHomeComponent),
    canActivate: [guestGuard] 
  },
  { 
    path: 'path/chapter/:chapterId', 
    loadComponent: () => import('./features/subject-path/pages/topic-path-view/topic-path-view.component').then(m => m.TopicPathViewComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'path/:id', 
    loadComponent: () => import('./features/subject-path/pages/path-view/path-view.component').then(m => m.PathViewComponent),
    canActivate: [guestGuard]
  },
  { 
    path: 'gameplay/:id', 
    loadComponent: () => import('./features/gameplay/pages/game-arena/game-arena.component').then(m => m.GameArenaComponent),
    canActivate: [guestGuard]
  },

  { 
    path: 'ai-hub', 
    loadChildren: () => import('./features/ai-hub/ai-hub.module').then(m => m.AiHubModule),
    canActivate: [guestGuard]
  },
  
  // Fallback
  { 
    path: '**', 
    redirectTo: 'auth/login'
  }
];