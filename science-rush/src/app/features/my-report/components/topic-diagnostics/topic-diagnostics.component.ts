import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';
import { ReportService, TopicDiagnostic } from '../../services/report.service';

@Component({
  selector: 'app-topic-diagnostics',
  templateUrl: './topic-diagnostics.component.html',
  styleUrls: ['./topic-diagnostics.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false
})
export class TopicDiagnosticsComponent implements OnInit {
  diagnostics$!: Observable<TopicDiagnostic[]>;

  constructor(private service: ReportService) {}

  ngOnInit() {
    this.diagnostics$ = this.service.getTopicDiagnostics();
  }
}
