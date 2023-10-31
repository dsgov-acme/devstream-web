import { CommonModule, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { AuditEventModel, EventActivityType, EventTitle } from '@dsg/shared/data-access/audit-api';
import { PagingRequestModel } from '@dsg/shared/data-access/http';
import { EnumMapType, PriorityVisuals } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { FormTransactionService } from '@dsg/shared/feature/form-nuv';
import { INFINITE_SCROLL_DEFAULTS, NuverialCardComponent, NuverialIconComponent, NuverialSpinnerComponent } from '@dsg/shared/ui/nuverial';
import { InfiniteScrollModule } from 'ngx-infinite-scroll';
import { Observable, firstValueFrom, scan, switchMap, take, tap } from 'rxjs';
import { TransactionDetailService } from '../transaction-detail/transaction-detail.service';
import { DocumentStatusChangedComponent } from './event-types/document-status-changed/document-status-changed.component';
import { NoteBaseEventComponent } from './event-types/note-base-event/note-base-event.component';
import { NoteUpdatedComponent } from './event-types/note-updated/note-updated.component';
import { TransactionCreatedComponent } from './event-types/transaction-created/transaction-created.component';
import { TransactionDataChangedComponent } from './event-types/transaction-data-changed/transaction-data-changed.component';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NuverialCardComponent,
    NuverialIconComponent,
    InfiniteScrollModule,
    TransactionDataChangedComponent,
    TransactionCreatedComponent,
    NoteBaseEventComponent,
    NoteUpdatedComponent,
    DocumentStatusChangedComponent,
    NuverialSpinnerComponent,
  ],
  providers: [TitleCasePipe],
  selector: 'dsg-events-log',
  standalone: true,
  styleUrls: ['./events-log.component.scss'],
  templateUrl: './events-log.component.html',
})
export class EventsLogComponent implements OnDestroy, OnInit {
  public fromConfiguration$ = this._formTransactionService.formConfiguration$;

  public transaction$ = this._formTransactionService.transaction$;
  public eventActivityType = EventActivityType;

  private readonly _businessObjectType = 'transaction';
  private readonly _pagingRequestModel: PagingRequestModel = new PagingRequestModel({
    pageSize: 15, //We set to 15 so that the scrollbar shows in order to trigger the infinite scroll
    sortBy: 'timestamp',
    sortOrder: 'DESC',
  });
  public isLoadingMoreEvents = false;

  public eventsDetails$?: Observable<AuditEventModel[]>;

  constructor(
    private readonly _transactionDetailService: TransactionDetailService,
    private readonly _userStateService: UserStateService,
    private readonly _formTransactionService: FormTransactionService,
    private readonly _enumService: EnumerationsStateService,
  ) {}

  public scrollDistance = INFINITE_SCROLL_DEFAULTS.scrollDistance;
  public scrollUpDistance = INFINITE_SCROLL_DEFAULTS.scrollUpDistance;
  public throttle = INFINITE_SCROLL_DEFAULTS.throttle;

  public ngOnInit() {
    this.eventsDetails$ = this.getEvents$().pipe(
      switchMap(_ => this._transactionDetailService.events$),
      switchMap(async events => {
        for (const event of events) {
          await this._handleEventTitle(event);
        }

        return events;
      }),
      scan((prevEvents: AuditEventModel[], newEvents: AuditEventModel[]) => [...prevEvents, ...newEvents], []),
    );
  }

  public ngOnDestroy(): void {
    this._transactionDetailService.clearEvents();
  }

  public trackByFn(index: number): number {
    return index;
  }

  public getEvents$(): Observable<AuditEventModel[]> {
    this.isLoadingMoreEvents = true;

    return this._transactionDetailService.loadEvents$(this._transactionDetailService.transactionId, this._businessObjectType, this._pagingRequestModel).pipe(
      tap(_ => {
        this.isLoadingMoreEvents = false;
      }),
      take(1),
    );
  }

  public loadMoreEvents() {
    if (!this._transactionDetailService.eventsPagination.nextPage) return;

    this._pagingRequestModel.pageNumber += 1;
    this.getEvents$().pipe(take(1)).subscribe();
  }

  private async _handleEventTitle(event: AuditEventModel): Promise<void> {
    try {
      const { activityType } = event.eventData;

      switch (activityType) {
        case EventActivityType.TransactionCreated:
          event.summary = EventTitle.TransactionCreated;
          break;
        case EventActivityType.TransactionDataChanged:
          event.summary = EventTitle.TransactionDataChanged;
          break;
        case EventActivityType.NoteAdded:
          event.summary = EventTitle.NoteAdded;
          break;
        case EventActivityType.NoteDeleted:
          event.summary = EventTitle.NoteDeleted;
          break;
        case EventActivityType.NoteUpdated:
          event.summary = EventTitle.NoteUpdated;
          break;
        case EventActivityType.TransactionAssignedToChanged:
          if (event.eventData.newState) {
            event.summary = `${await firstValueFrom(
              this._userStateService.getUserDisplayName$(event.requestContext?.userId || ''),
            )} assigned this application to ${await firstValueFrom(this._userStateService.getUserDisplayName$(event.eventData.newState))}`;
          } else {
            event.summary = `${await firstValueFrom(
              this._userStateService.getUserDisplayName$(event.requestContext?.userId || ''),
            )} unassigned this application`;
          }

          break;
        case EventActivityType.TransactionStatusChanged:
          event.summary = `Application status changed from ${event.eventData.oldState} to ${event.eventData.newState}`;
          break;
        case EventActivityType.DocumentUnaccepted:
          event.summary = 'Document reset back to New from Accepted';
          break;
        case EventActivityType.DocumentUnrejected:
          event.summary = 'Document reset back to New from Rejected';
          break;
        case EventActivityType.TransactionPriorityChanged:
          event.summary = await this._getPriorityChangedSummary(event);
          break;
      }
    } catch (error) {
      event.summary = 'Unable to render event summary';
    }
  }

  private async _getPriorityChangedSummary(event: AuditEventModel): Promise<string> {
    const defaultPrefix = 'Application priority changed ';

    try {
      const oldKey = event.eventData.oldState;
      const newKey = event.eventData.newState;

      if (oldKey && newKey) {
        const oldLabel = (await firstValueFrom(this._enumService.getDataFromEnum$(EnumMapType.TransactionPriorities, oldKey))).label;
        const newLabel = (await firstValueFrom(this._enumService.getDataFromEnum$(EnumMapType.TransactionPriorities, newKey))).label;

        const changePrefix = `${defaultPrefix}from `;
        const summaryJoiner = ' to ';

        const oldContent = this._getInnerPriorityElement(oldKey.toLowerCase(), oldLabel);
        const newContent = this._getInnerPriorityElement(newKey.toLowerCase(), newLabel);

        return `${changePrefix}${oldContent}${summaryJoiner}${newContent}`;
      }

      return `${defaultPrefix}(Missing changed values)`;
    } catch (error) {
      return `${defaultPrefix}(Unable to render changed values)`;
    }
  }

  private _getInnerPriorityElement(key: string, label: string): string {
    return `<span class="title-priority ${key}">
      <span class="material-icons priority-icon">${PriorityVisuals[key].icon}</span>${label}</span>`;
  }
}
