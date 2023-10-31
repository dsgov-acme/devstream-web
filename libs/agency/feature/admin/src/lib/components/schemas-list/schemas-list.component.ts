import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort, SortDirection } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router } from '@angular/router';
import { IPagingMetadata, PagingRequestModel, PagingResponseModel, SortOrder, pageSizeOptions } from '@dsg/shared/data-access/http';
import { ISchemaDefinition, ISchemasPaginationResponse, SchemaTableData, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { UserStateService } from '@dsg/shared/feature/app-state';
import {
  NuverialButtonComponent,
  NuverialIconComponent,
  NuverialSnackBarService,
  NuverialSpinnerComponent,
  NuverialTextInputComponent,
  SplitCamelCasePipe,
} from '@dsg/shared/ui/nuverial';
import { BehaviorSubject, Observable, catchError, firstValueFrom, of, switchMap, tap } from 'rxjs';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    NuverialTextInputComponent,
    MatPaginatorModule,
    NuverialSpinnerComponent,
    SplitCamelCasePipe,
    MatTableModule,
    MatSortModule,
    NuverialButtonComponent,
    NuverialIconComponent,
  ],
  providers: [DatePipe],
  selector: 'dsg-schemas-list',
  standalone: true,
  styleUrls: ['./schemas-list.component.scss'],
  templateUrl: './schemas-list.component.html',
})
export class SchemasListComponent {
  public displayedColumns = [
    { label: 'Key', sortable: true, value: 'key', width: '18%' },
    { label: 'Name', sortable: false, value: 'name', width: '20%' },
    { label: 'Description', sortable: false, value: 'description', width: '22%' },
    { label: 'Date Created', sortable: true, value: 'createdTimestamp', width: '13%' },
    { label: 'Last Updated', sortable: true, value: 'lastUpdatedTimestamp', width: '13%' },
    { label: 'Created By', sortable: false, value: 'createdBy', width: '14%' },
  ];
  public displayColumnValues = this.displayedColumns.map(x => x.value);
  public searchInput = new FormControl();
  public schemaList: ISchemaDefinition[] = [];
  public schemaListIsLoading = true;
  public dataSourceTable = new MatTableDataSource<unknown>();
  public sortDirection: SortDirection = 'asc';
  public pagingMetadata: IPagingMetadata | undefined;
  public pageSizeOptions = pageSizeOptions;
  public readonly pagingRequestModel: PagingRequestModel = new PagingRequestModel({}, this._router, this._activatedRoute);
  public searchBoxIcon = 'search';
  private readonly _searchFilter: BehaviorSubject<string> = new BehaviorSubject<string>('');

  @ViewChild(MatSort) public tableSort!: MatSort;

  constructor(
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _router: Router,
    private readonly _datePipe: DatePipe,
    private readonly _cdr: ChangeDetectorRef,
    private readonly _activatedRoute: ActivatedRoute,
    private readonly _userStateService: UserStateService,
    private readonly _nuverialSnackBarService: NuverialSnackBarService,
  ) {}

  public schemaDefinitionsList$: Observable<ISchemasPaginationResponse<ISchemaDefinition>> = this._searchFilter.asObservable().pipe(
    switchMap(searchText =>
      this._workApiRoutesService
        .getSchemaDefinitionsList$(
          [
            { field: 'key', value: searchText },
            { field: 'name', value: searchText },
          ],
          this.pagingRequestModel,
        )
        .pipe(
          tap(x => {
            this.schemaListIsLoading = false;
            this.schemaList = x.items;
            this.pagingMetadata = x.pagingMetadata;
            this._applyDatePipes();
            this._buildDataSourceTable();
          }),
        ),
    ),
    catchError(_ => {
      this.schemaListIsLoading = false;
      this._cdr.markForCheck();
      this._nuverialSnackBarService.notifyApplicationError();

      return of({
        items: [],
        pagingMetadata: new PagingResponseModel(),
      });
    }),
  );

  public getSchemasList() {
    this.schemaListIsLoading = true;
    const searchText = this.searchInput.value ? this.searchInput.value.trim().toLowerCase() : '';
    this._searchFilter.next(searchText);
  }

  public setSearchBoxIcon() {
    const searchText = this.searchInput.value ? this.searchInput.value.trim().toLowerCase() : '';
    this.searchBoxIcon = searchText ? 'cancel_outline' : 'search';
  }

  public clearSearch() {
    this.searchInput.setValue('');
    this.setSearchBoxIcon();
    this.getSchemasList();
  }

  public handleSearch(): void {
    this.pagingRequestModel.pageNumber = 0;
    this.getSchemasList();
  }

  public setPage($event: PageEvent): void {
    this.pagingRequestModel.pageSize = $event.pageSize;
    this.pagingRequestModel.pageNumber = $event.pageIndex;
    this.getSchemasList();
  }

  public sortData($event: Sort): void {
    this.pagingRequestModel.sortBy = $event.active;
    this.pagingRequestModel.sortOrder = $event.direction.toUpperCase() as SortOrder;
    this.getSchemasList();
  }

  private _applyDatePipes(): void {
    this.schemaList.forEach(item => {
      item.createdTimestamp = this._datePipe.transform(item.createdTimestamp, 'MM/dd/yyyy') || item.createdTimestamp;
      item.lastUpdatedTimestamp = this._datePipe.transform(item.lastUpdatedTimestamp, 'MM/dd/yyyy') || item.lastUpdatedTimestamp;
    });
  }

  private async _buildDataSourceTable(): Promise<void> {
    const schemaTableData: SchemaTableData[] = [];
    if (this.schemaList) {
      for (const schema of this.schemaList) {
        const item: SchemaTableData = {
          ...schema,
          createdBy: await firstValueFrom(this._userStateService.getUserDisplayName$(schema.createdBy)),
        };
        schemaTableData.push(item);
      }

      this.dataSourceTable = new MatTableDataSource<unknown>(schemaTableData);
      this._cdr.detectChanges();
      this.sortDirection = this.pagingRequestModel.sortOrder.toLowerCase() as SortDirection;
    }
  }

  public navigateToAddSchema(): void {
    this._router.navigate(['/admin', 'schemas', 'create']);
  }

  public trackByFn(index: number): number {
    return index;
  }
}
