import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { Filter, PagingRequestModel } from '@dsg/shared/data-access/http';
import { UserModel } from '@dsg/shared/data-access/user-api';
import { EnumMapType, PriorityVisuals } from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import { FormRendererComponent, FormTransactionService } from '@dsg/shared/feature/form-nuv';
import {
  ActiveTabChangeEvent,
  INuverialBreadCrumb,
  INuverialSelectOption,
  INuverialTab,
  NuverialBreadcrumbComponent,
  NuverialCopyButtonComponent,
  NuverialFooterActionsComponent,
  NuverialIconComponent,
  NuverialPillComponent,
  NuverialSelectComponent,
  NuverialSnackBarService,
  NuverialSpinnerComponent,
  NuverialTabKeyDirective,
  NuverialTabsComponent,
} from '@dsg/shared/ui/nuverial';
import { UntilDestroy } from '@ngneat/until-destroy';
import { EMPTY, Observable, catchError, concatMap, finalize, map, of, switchMap, take, tap } from 'rxjs';
import { EventsLogComponent } from '../events-log/events-log.component';
import { NotesComponent } from '../notes';
import { ReviewFormComponent } from '../review';
import { TransactionDetailService } from './transaction-detail.service';

enum DetailTabs {
  DETAIL = 'detail',
  NOTES = 'notes',
  EVENTS = 'events',
}

@UntilDestroy()
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormRendererComponent,
    FormsModule,
    ReactiveFormsModule,
    NotesComponent,
    NuverialCopyButtonComponent,
    NuverialSpinnerComponent,
    NuverialBreadcrumbComponent,
    NuverialTabsComponent,
    NuverialIconComponent,
    NuverialTabKeyDirective,
    NuverialSelectComponent,
    NuverialPillComponent,
    ReviewFormComponent,
    RouterModule,
    EventsLogComponent,
    NuverialFooterActionsComponent,
  ],
  selector: 'dsg-transaction-detail',
  standalone: true,
  styleUrls: ['./transaction-detail.component.scss'],
  templateUrl: './transaction-detail.component.html',
})
export class TransactionDetailComponent implements OnDestroy, OnInit {
  private readonly _agentsPagingRequestModel: PagingRequestModel = new PagingRequestModel({
    pageSize: 5,
  });
  public breadCrumbs: INuverialBreadCrumb[] = [{ label: 'Back To Claims', navigationPath: `/dashboard` }];
  public transaction$ = this._formTransactionService.transaction$.pipe(
    tap(transactionModel => {
      this.priorityControl.setValue(transactionModel.priority);
      this.assignedToControl.setValue(transactionModel.assignedTo);
    }),
    concatMap(transactionModel => of(transactionModel)),
  );
  public user$ = this._transactionDetailService.user$;
  public priorityControl = new FormControl();
  public prioritySelectOptionsSorted$: Observable<INuverialSelectOption[]> = this._enumService.getEnumMap$(EnumMapType.TransactionPriorities).pipe(
    map(statuses => {
      const reviewStatusSelectOptions: INuverialSelectOption[] = [];

      Array.from(statuses.entries())
        .sort(([, a], [, b]) => {
          if (a.rank !== undefined && b.rank !== undefined) {
            return a.rank - b.rank;
          } else return 0;
        })
        .forEach(([key, value]) => {
          reviewStatusSelectOptions.push({
            color: PriorityVisuals[key.toLowerCase()].color,
            disabled: false,
            displayTextValue: value.label,
            key: key,
            prefixIcon: PriorityVisuals[key.toLowerCase()].icon,
            selected: false,
          });
        });

      return reviewStatusSelectOptions;
    }),
  );

  public assignedToControl = new FormControl();
  public assignedToSelectOptions: INuverialSelectOption[] = [];

  public activeTaskId = '';
  public isTransactionStatusRequestPending = false;

  public agentsSelectOptions$: Observable<INuverialSelectOption[]> = this.getAgents$().pipe(
    switchMap(_ => this._transactionDetailService.agents$),
    map(agents =>
      agents.map(agent => {
        return {
          disabled: false,
          displayTextValue: agent.displayName === agent.email ? agent.email : `${agent.displayName} - ${agent.email}`,
          key: agent.id,
          selected: false,
        };
      }),
    ),
  );

  public transactionActiveTask$ = this._transactionDetailService.transactionActiveTask$.pipe(
    tap(transactionActiveTask => (this.activeTaskId = transactionActiveTask?.key || '')),
  );

  public loadTransactionDetails$ = this._route.paramMap.pipe(
    switchMap(params => {
      const transactionId = params.get('transactionId') ?? '';

      return this._transactionDetailService.initialize$(transactionId).pipe(
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError();

          return EMPTY;
        }),
      );
    }),
  );

  public detailTabs = DetailTabs;
  public activeTabIndex = 0;
  public tabs: INuverialTab[] = [
    { key: DetailTabs.DETAIL, label: 'Detail' },
    { key: DetailTabs.NOTES, label: 'Notes' },
    { key: DetailTabs.EVENTS, label: 'Activity Log' },
  ];

  public getAgents$(filters?: Filter[]): Observable<UserModel[]> {
    return this._transactionDetailService.loadAgencyUsers$(filters, this._agentsPagingRequestModel);
  }

  public handlePriority(selectedOption: INuverialSelectOption): void {
    this.isTransactionStatusRequestPending = true;
    this._transactionDetailService
      .updateTransactionPriority$(selectedOption.key)
      .pipe(
        take(1),
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError('Error updating priority');
          this.priorityControl.setValue(this._formTransactionService.transaction.priority);

          return EMPTY;
        }),
        finalize(() => {
          this.isTransactionStatusRequestPending = false;
          this._changeDetectorRef.detectChanges();
        }),
      )
      .subscribe();
  }

  public handleSearchAgent(search: string) {
    if (search) {
      const filters = [{ field: 'name', value: search }];

      this.getAgents$(filters).pipe(take(1)).subscribe();
    }
  }

  public handleAssignedTo(agentId: string): void {
    this.isTransactionStatusRequestPending = true;
    this._transactionDetailService
      .updateTransactionAssignedTo$(agentId)
      .pipe(
        take(1),
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError('Error updating assigned agent');
          this.priorityControl.setValue(this._formTransactionService.transaction.assignedTo);

          return EMPTY;
        }),
        finalize(() => {
          this.isTransactionStatusRequestPending = false;
          this._changeDetectorRef.detectChanges();
        }),
      )
      .subscribe();
  }

  public handleUnassign(): void {
    this.handleAssignedTo('');
  }

  constructor(
    private readonly _formTransactionService: FormTransactionService,
    private readonly _transactionDetailService: TransactionDetailService,
    private readonly _route: ActivatedRoute,
    private readonly _router: Router,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
    private readonly _changeDetectorRef: ChangeDetectorRef,
    private readonly _enumService: EnumerationsStateService,
  ) {}

  public copyId(id: string): void {
    navigator.clipboard.writeText(id);
  }

  public ngOnInit(): void {
    const childRoute = this._route.firstChild;
    const activeTab: string = childRoute?.snapshot.data['activeTab'];

    this.activeTabIndex = this.tabs.findIndex(tab => tab.key === activeTab);
  }

  public ngOnDestroy(): void {
    this._formTransactionService.cleanUp();
    this._transactionDetailService.cleanUp();
  }

  public setActiveTab(event: ActiveTabChangeEvent) {
    const activeTabKey = event.tab.key as DetailTabs;
    const transactionId = this._formTransactionService.transactionId;

    switch (activeTabKey) {
      case this.detailTabs.NOTES:
        this._router.navigate(['/dashboard', 'transaction', transactionId, 'notes']);
        break;
      case this.detailTabs.EVENTS:
        this._router.navigate(['/dashboard', 'transaction', transactionId, 'events']);
        break;
      case this.detailTabs.DETAIL:
      default:
        this._router.navigate(['/dashboard', 'transaction', transactionId]);
        break;
    }
  }

  public onActionClick(event: string) {
    this.isTransactionStatusRequestPending = true;

    this._transactionDetailService
      .reviewTransaction$(event, this.activeTaskId)
      .pipe(
        take(1),
        tap(_ => {
          this._nuverialSnackBarService.notifyApplicationSuccess();
        }),
        catchError(_error => {
          this._nuverialSnackBarService.notifyApplicationError('Error updating transaction status');

          return EMPTY;
        }),
        finalize(() => {
          this.isTransactionStatusRequestPending = false;
          this._changeDetectorRef.detectChanges();
        }),
      )
      .subscribe();
  }

  public trackByFn(index: number): number {
    return index;
  }
}
