// import { Injectable } from '@angular/core';
// import { Router } from '@angular/router';
// import { HttpClient } from '@angular/common/http';
// import { BehaviorSubject, Observable, tap, map } from 'rxjs';
// import { environment } from '../../../environments/environment';

// export interface UserIdentity {
//   _id: string;
//   name: string;
//   email: string;
//   role: string;
//   subscription?: {
//     plan: 'free' | 'pro' | 'premium';
//     status: 'active' | 'expired';
//   };
//   gamification?: {
//     streak: number;
//     total_xp: number;
//     lastActivityDate?: string | Date;
//   };
// }

// @Injectable({ providedIn: 'root' })
// export class AuthService {
//   private apiUrl = `${environment.apiUrl}/auth`;

//   // 1. BehaviorSubject holds the full User Object (or null)
//   private userSubject = new BehaviorSubject<UserIdentity | null>(
//     this.getUserFromStorage()
//   );

//   // 2. Public stream for components to subscribe to
//   public user$ = this.userSubject.asObservable();

//   // 3. Pro Stream
//   public isPro$ = this.user$.pipe(
//     map(
//       (user) =>
//         user?.subscription?.plan === 'pro' ||
//         user?.subscription?.plan === 'premium'
//     )
//   );

//   constructor(private http: HttpClient, private router: Router) {}

//   // ✅ FIX 1: Add Signup Method
//   signup(payload: any): Observable<any> {
//     // Matches your backend route: router.post('/register', ...)
//     return this.http.post<any>(`${this.apiUrl}/register`, payload).pipe(
//       tap((response) => {
//         if (response.status === 'success') {
//           this.handleAuthSuccess(response.data.user);
//         }
//       })
//     );
//   }

//   // ✅ FIX 2: Add isAuthenticated Method (Used by AuthGuard)
//   isAuthenticated(): boolean {
//     return !!this.userSubject.value; // Returns true if user exists, false if null
//   }

//   // ✅ FIX 3: Add getUser Method (Used by Dashboard)
//   getUser(): UserIdentity | null {
//     return this.userSubject.value;
//   }

//   // --- EXISTING METHODS ---

//   login(credentials: { email: string; password: string }): Observable<any> {
//     // --- 1. LOGIN ---

//     return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
//       tap((response) => {
//         if (response.status === 'success') {
//           this.handleAuthSuccess(response.data.user);
//         }
//       })
//     );
//   }

//   updateUserState(updatedUser: UserIdentity) {
//     this.handleAuthSuccess(updatedUser);
//   }

//   private handleAuthSuccess(user: UserIdentity) {
//     localStorage.setItem('science_rush_user', JSON.stringify(user));
//     this.userSubject.next(user);
//   }

//   private getUserFromStorage(): UserIdentity | null {
//     const userStr = localStorage.getItem('science_rush_user');
//     return userStr ? JSON.parse(userStr) : null;
//   }

//   get isProValue(): boolean {
//     const user = this.userSubject.value;
//     return (
//       user?.subscription?.plan === 'pro' ||
//       user?.subscription?.plan === 'premium'
//     );
//   }

//   logout(): void {
//     localStorage.removeItem('science_rush_user');
//     this.userSubject.next(null);
//     this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
//     this.router.navigate(['/auth/login']);
//   }
// }



import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, map } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UserIdentity {
  _id: string;
  name: string;
  email: string;
  role: string;
  subscription?: {
    plan: 'free' | 'pro' | 'premium';
    status: 'active' | 'expired';
  };
  gamification?: {
    streak: number;
    total_xp: number;
    lastActivityDate?: string | Date;
  };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;

  // 1. BehaviorSubject holds the full User Object (or null)
  private userSubject = new BehaviorSubject<UserIdentity | null>(
    this.getUserFromStorage()
  );

  // 2. Public stream for components to subscribe to
  public user$ = this.userSubject.asObservable();

  // 3. Pro Stream
  public isPro$ = this.user$.pipe(
    map(
      (user) =>
        user?.subscription?.plan === 'pro' ||
        user?.subscription?.plan === 'premium'
    )
  );

  constructor(private http: HttpClient, private router: Router) {}

  signup(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/register`, payload).pipe(
      tap((response) => {
        if (response.status === 'success') {
          // Hunt for the token in the registration response
          const token = response.token || response.data?.token || response.access_token;
          const user = response.data?.user || response.user;
          this.handleAuthSuccess(user, token);
        }
      })
    );
  }

  isAuthenticated(): boolean {
    return !!this.userSubject.value; 
  }

  getUser(): UserIdentity | null {
    return this.userSubject.value;
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        // Logging the response to double check if we ever need to debug again
        console.log("AuthService Login Response:", response);
        
        if (response.status === 'success') {
          // 🚀 THE TOKEN HUNTER: Looks in all common Node.js response locations
          const token = response.token || response.data?.token || response.access_token;
          const user = response.data?.user || response.user;
          
          if (!token) {
            console.warn("⚠️ WARNING: Logged in successfully, but no token was found in the response payload! Check if your Node.js server is sending the token in an HTTP-Only Cookie instead of the JSON body.");
          }

          this.handleAuthSuccess(user, token);
        }
      })
    );
  }

  updateUserState(updatedUser: UserIdentity) {
    const currentToken = localStorage.getItem('access_token');
    this.handleAuthSuccess(updatedUser, currentToken);
  }

  // 🚀 THE FIX: Now accepts and explicitly saves the token to localStorage
  private handleAuthSuccess(user: UserIdentity, token?: string | null) {
    // Save the user profile
    localStorage.setItem('science_rush_user', JSON.stringify(user));
    
    // Save the AI token if we successfully grabbed it
    if (token) {
      localStorage.setItem('access_token', token);
      console.log("✅ Token successfully saved to browser!");
    }
    
    this.userSubject.next(user);
  }

  private getUserFromStorage(): UserIdentity | null {
    const userStr = localStorage.getItem('science_rush_user');
    return userStr ? JSON.parse(userStr) : null;
  }

  get isProValue(): boolean {
    const user = this.userSubject.value;
    return (
      user?.subscription?.plan === 'pro' ||
      user?.subscription?.plan === 'premium'
    );
  }

  logout(): void {
    // Clear everything out on logout
    localStorage.removeItem('science_rush_user');
    localStorage.removeItem('access_token'); 
    
    this.userSubject.next(null);
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      error: (e) => console.log("Logout API call handled", e)
    });
    this.router.navigate(['/auth/login']);
  }
}