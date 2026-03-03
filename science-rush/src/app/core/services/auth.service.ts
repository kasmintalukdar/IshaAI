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

  // ✅ FIX 1: Add Signup Method
  signup(payload: any): Observable<any> {
    // Matches your backend route: router.post('/register', ...)
    return this.http.post<any>(`${this.apiUrl}/register`, payload).pipe(
      tap((response) => {
        if (response.status === 'success') {
          this.handleAuthSuccess(response.data.user);
        }
      })
    );
  }

  // ✅ FIX 2: Add isAuthenticated Method (Used by AuthGuard)
  isAuthenticated(): boolean {
    return !!this.userSubject.value; // Returns true if user exists, false if null
  }

  // ✅ FIX 3: Add getUser Method (Used by Dashboard)
  getUser(): UserIdentity | null {
    return this.userSubject.value;
  }

  // --- EXISTING METHODS ---

  login(credentials: { email: string; password: string }): Observable<any> {
    // --- 1. LOGIN ---

    return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => {
        if (response.status === 'success') {
          this.handleAuthSuccess(response.data.user);
        }
      })
    );
  }

  updateUserState(updatedUser: UserIdentity) {
    this.handleAuthSuccess(updatedUser);
  }

  private handleAuthSuccess(user: UserIdentity) {
    localStorage.setItem('science_rush_user', JSON.stringify(user));
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
    localStorage.removeItem('science_rush_user');
    this.userSubject.next(null);
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe();
    this.router.navigate(['/auth/login']);
  }
}
