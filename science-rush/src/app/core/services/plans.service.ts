import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PremiumPlan } from '@shared/components/premium-promo-card/premium-promo-card.component';

interface ApiResponse<T> {
  status: string;
  data: T;
}

@Injectable({
  providedIn: 'root',
})
export class PlansService {
  // Adjust API URL if plans are not under '/profile'
  // e.g. http://localhost:3000/api/v1/plans
  private apiUrl = `${environment.apiUrl || '/api/v1'}/plans`;

  constructor(private http: HttpClient) {}

  getSubscriptionPlans(): Observable<PremiumPlan[]> {
    // We expect the API to return { status: 'success', data: { plans: [...] } }
    return this.fetchData<any>('allplans', []).pipe(
      map((res: any) => {
        return res;
      })
    );
  }

  // getSubscriptionPlans(): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/plans/allplans`);
  // }

  // 1. Create Order
  // inside PlanService

  createOrder(planId: string) {
    // 2. FIX URL: Use 'environment.apiUrl' directly to avoid the extra '/plans'
    // Result: /api/v1/payments/create-order
    const paymentUrl = `${environment.apiUrl}/payments/create-order`;

    // 3. FIX PAYLOAD: Send 'planId' so the backend can find the price in the DB
    return this.http.post(paymentUrl, { planId });
  }
  // 2. Verify Payment
  // inside PlansService

  verifyPayment(payload: any) {
    // Uses environment.apiUrl directly to get: /api/v1/payments/verify
    return this.http.post(`${environment.apiUrl}/payments/verify`, payload);
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
