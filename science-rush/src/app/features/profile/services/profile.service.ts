import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay, delay } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PremiumPlan } from '@shared/components/premium-promo-card/premium-promo-card.component';

export interface userProfileInfo {
  name: string;
  email: string;
  stream: string;
  avatar: string;

  // Add Gamification here so the Header can read the streak
  gamification?: {
    streak: number;
    total_xp: number;
    current_league?: number;
    top_accuracy?: number;
    last_active_date?: string;
  };

  subscription?: {
    plan: 'free' | 'pro' | 'premium';
    status: 'active' | 'expired';
  };
}
export interface UserGems {
  balance: number;
}

interface ApiResponse<T> {
  status: string;
  data: T;
}

export interface userStats {
  total_xp: number;
  streak: number;
  current_league: number;
  top_accuracy: number;
  last_active_date: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  private apiUrl = `${environment.apiUrl || '/api/v1'}/profile`;

  constructor(private http: HttpClient) {}

  getUserInfo(): Observable<userProfileInfo | null> {
    return this.fetchData<any>('user-profile', null).pipe(
      map((data) => {
        if (data && data.profile) {
          return {
            ...data.profile,
            subscription: data.subscription, // Assuming backend sends this root object
          };
        }
        return null;
      })
    );
  }
  isProUser(user: userProfileInfo | null): boolean {
    return (
      user?.subscription?.plan === 'pro' ||
      user?.subscription?.plan === 'premium'
    );
  }

  getUserGems(): Observable<UserGems | null> {
    return this.fetchData<any>('user-gems', null).pipe(
      map((data) => {
        if (data && data.wallet) {
          return { balance: data.wallet.gems };
        }
        return null;
      })
    );
  }

  submitFeedback(
    type: string,
    rating: number,
    message: string
  ): Observable<any> {
    const payload = { type, rating, message };

    // Calls POST /api/v1/profile/feedback
    return this.http
      .post<ApiResponse<any>>(`${this.apiUrl}/feedback`, payload)
      .pipe(
        map((response) => response.data),
        catchError((err) => {
          console.error('Error submitting feedback:', err);
          return of({ success: false });
        })
      );
  }

  getUserStats(): Observable<userStats | null> {
    return this.fetchData<any>('user-stats', null).pipe(
      map((data) => {
        if (data && data.gamification) {
          return data.gamification;
        }
      })
    );
  }

  updateProfile(name: string, file: File | null): Observable<any> {
    const formData = new FormData();

    // 1. Append the text data
    formData.append('name', name);

    // 2. Append the file (if it exists)
    // The key 'image' MUST match upload.single('image') in your Node backend
    if (file) {
      formData.append('image', file);
    }

    // 3. Send as FormData (Angular handles the Content-Type automatically)
    return this.http.patch(`${this.apiUrl}/profile-update`, formData);
  }

  private fetchData<T>(endpoint: string, fallback: T): Observable<T> {
    return this.http.get<ApiResponse<T>>(`${this.apiUrl}/${endpoint}`).pipe(
      map((response) => response.data),
      shareReplay(1),
      catchError((err) => {
        console.error(`Error fetching ${endpoint}:`, err);
        return of(fallback);
      })
    );
  }
}
