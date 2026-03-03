import { Component, Output, EventEmitter, OnInit, ChangeDetectorRef } from '@angular/core';
import { PremiumPromoCardComponent, PremiumPlan } from '../premium-promo-card/premium-promo-card.component';
import { PlansService } from '@core/services/plans.service';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';

// Declare Razorpay on window object to avoid TS errors
declare var Razorpay: any;

@Component({
  selector: 'app-upgrade-modal',
  templateUrl: './upgrade-modal.component.html',
  styleUrls: ['./upgrade-modal.component.scss'],
  standalone: true,
  imports: [PremiumPromoCardComponent, CommonModule]
})
export class UpgradeModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  
  // Use Observable<any> or stricter type if you have a PlanResponse interface
  plans$!: Observable<any>; 

  constructor(
    private plansService: PlansService,
    private cdr: ChangeDetectorRef 
  ) {}

  ngOnInit(): void {
    // 1. Fetch plans on load
    this.plans$ = this.plansService.getSubscriptionPlans();
  }

 handleSelect(plan: PremiumPlan) {
    // 1. Safety Check: Ensure the plan has an ID
    if (!plan._id) {
      console.error('Error: Plan ID is missing.');
      return;
    }

    // 2. Now TypeScript knows plan._id is definitely a string
    this.plansService.createOrder(plan._id).subscribe({
      next: (res: any) => {
        this.openCheckout(res.data, plan);
      },
      error: (err) => {
        console.error('Order creation failed', err);
        alert('Could not initiate payment. Please try again.');
      }
    });
  }

  openCheckout(orderData: any, plan: PremiumPlan) {
    const options = {
      key: orderData.key_id, 
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Science Rush',
      description: `Upgrade to ${plan.name}`,
      order_id: orderData.order_id, // CRITICAL: The ID created by your backend
      
      // Handler for SUCCESS
      handler: (response: any) => {
        this.verifyPayment(response, plan);
      },
      
      prefill: {
        // Optional: Prefill if you have user data
        // name: 'Susmit',
        // email: 'susmit@example.com',
      },
      theme: {
        color: '#764ba2'
      },
      modal: {
        // handle when user closes the modal manually
        ondismiss: function() {
          console.log('Payment cancelled by user');
        }
      }
    };

    const rzp1 = new Razorpay(options);
    
    // Handler for FAILURE (Network failure, etc.)
    rzp1.on('payment.failed', function (response: any){
        console.error(response.error);
        alert("Payment Failed: " + response.error.description);
    });

    rzp1.open();
  }

  verifyPayment(response: any, plan: PremiumPlan) {
    const payload = {
      razorpay_order_id: response.razorpay_order_id,
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_signature: response.razorpay_signature,
      planId: plan._id // CRITICAL: Needed for your backend to calculate subscription dates
    };

    this.plansService.verifyPayment(payload).subscribe({
      next: (res) => {
        alert('Upgrade Successful! Welcome to Pro.');
        this.close.emit();
        // Optional: Reload the page or fetch new user profile here to update UI
        // window.location.reload(); 
      },
      error: (err) => {
        console.error(err);
        alert('Payment verification failed. Please contact support.');
      }
    });
  }
}