import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit } from '@angular/core';
import { AuditEventModel } from '@dsg/shared/data-access/audit-api';
import { EnumMapType, FormConfigurationModel } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import { DocumentFormService } from '@dsg/shared/feature/form-nuv';
import { take, tap } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
  selector: 'dsg-document-status-changed',
  standalone: true,
  styleUrls: ['./document-status-changed.component.scss'],
  templateUrl: './document-status-changed.component.html',
})
export class DocumentStatusChangedComponent implements OnInit {
  @Input()
  public event?: AuditEventModel;
  public documentName?: string;
  public rejectedReasons: string[] = [];
  public documentId = '';

  @Input()
  public fromConfiguration?: FormConfigurationModel;

  constructor(private readonly documentFormService: DocumentFormService, private readonly _enumService: EnumerationsStateService) {}

  public ngOnInit(): void {
    if (!this.event) return;

    this.handleDocumentStatusChangedEvent(this.event);
  }

  public trackByFn(index: number): number {
    return index;
  }

  private handleDocumentStatusChangedEvent(event: AuditEventModel) {
    const { data } = event.eventData;

    if (data) {
      const eventData = JSON.parse(data);
      this.documentName = this.fromConfiguration?.getComponentLabelByKey(eventData.documentFieldPath);
      this.documentId = eventData.documentId;

      this._enumService
        .getEnumMap$(EnumMapType.DocumentRejectionReasons)
        .pipe(
          take(1),
          tap(reasons => {
            eventData.rejectedReasons.forEach((rejectedReason: string) => {
              if (!rejectedReason) return;

              this.rejectedReasons.push(reasons.get(rejectedReason)?.label ?? 'REASON NOT FOUND');
            });
          }),
        )
        .subscribe();
    }
  }

  public openDocument(documentId: string) {
    this.documentFormService.openDocument$(documentId).pipe(take(1)).subscribe();
  }
}
