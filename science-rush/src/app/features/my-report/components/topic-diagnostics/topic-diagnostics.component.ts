import { Component, OnInit, ChangeDetectionStrategy, Output, EventEmitter } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportService, TopicDiagnostic } from '../../services/report.service';

@Component({
  selector: 'app-topic-diagnostics',
  templateUrl: './topic-diagnostics.component.html',
  styleUrls: ['./topic-diagnostics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false // ❌ CRITICAL
})
export class TopicDiagnosticsComponent implements OnInit {
  diagnostics$!: Observable<TopicDiagnostic[]>;
  showUpgradeModal = false
  @Output() requestUpgrade = new EventEmitter<void>();

  onUnlockClicked() {
    this.requestUpgrade.emit();
  }
  constructor(private service: ReportService) {}
  ngOnInit() { this.diagnostics$ = this.service.getTopicDiagnostics(); 
    // this.isPro = this.service.isProUser(user);
  }

  openSubscriptionModal() {
    // Logic to open your upgrade modal
  }
}