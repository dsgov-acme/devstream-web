/* istanbul ignore file */
import { ActivatedRoute, Params, Router } from '@angular/router';
import { SchemaModel } from '../base.model';

export type SortOrder = 'ASC' | 'DESC';

export const pageSizeOptions = [10, 20, 50];

export interface IPagingRequest {
  pageNumber?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: SortOrder;
}

export class PagingRequestModel implements SchemaModel<IPagingRequest, string> {
  private _pageNumber = 0;
  private _pageSize = 50;
  private _sortBy = '';
  private _sortOrder: SortOrder = 'ASC';

  constructor(paging?: IPagingRequest, private readonly _router?: Router, private readonly _activatedRoute?: ActivatedRoute) {
    if (paging) {
      this.fromSchema(paging);
    }
  }

  public get pageNumber(): number {
    return this._pageNumber;
  }

  public set pageNumber(pageNumber: number) {
    this._pageNumber = pageNumber;
    this._router?.navigate([], {
      queryParams: { pageNumber: pageNumber, pageSize: this.pageSize, sortBy: this.sortBy, sortOrder: this.sortOrder } as Params,
      queryParamsHandling: 'merge',
      relativeTo: this._activatedRoute,
    });
  }

  public get pageSize(): number {
    return this._pageSize;
  }

  public set pageSize(pageSize: number) {
    this._pageSize = pageSize;
    this._router?.navigate([], {
      queryParams: { pageNumber: this.pageNumber, pageSze: pageSize, sortBy: this.sortBy, sortOrder: this.sortOrder } as Params,
      queryParamsHandling: 'merge',
      relativeTo: this._activatedRoute,
    });
  }

  public get sortBy(): string {
    return this._sortBy;
  }

  public set sortBy(sortBy: string) {
    this._sortBy = sortBy;
    this._router?.navigate([], {
      queryParams: { pageNumber: this.pageNumber, pageSize: this.pageSize, sortBy: sortBy, sortOrder: this.sortOrder } as Params,
      queryParamsHandling: 'merge',
      relativeTo: this._activatedRoute,
    });
  }

  public get sortOrder(): SortOrder {
    return this._sortOrder;
  }

  public set sortOrder(sortOrder: SortOrder) {
    this._sortOrder = sortOrder;
    this._router?.navigate([], {
      queryParams: { pageNumber: this.pageNumber, pageSize: this.pageSize, sortBy: this.sortBy, sortOrder: sortOrder } as Params,
      queryParamsHandling: 'merge',
      relativeTo: this._activatedRoute,
    });
  }

  public fromSchema(paging: IPagingRequest) {
    this._pageNumber = this._activatedRoute?.snapshot.queryParams['pageNumber'] || paging.pageNumber || 0;
    this._pageSize = this._activatedRoute?.snapshot.queryParams['pageSize'] || paging.pageSize || pageSizeOptions[0];
    this._sortBy = this._activatedRoute?.snapshot.queryParams['sortBy'] || paging.sortBy || '';
    this._sortOrder = this._activatedRoute?.snapshot.queryParams['sortOrder'] || paging.sortOrder || 'ASC';
  }

  public toSchema(): string {
    let paging = `?pageNumber=${this._pageNumber}&pageSize=${this._pageSize}&sortOrder=${this._sortOrder}`;

    if (this._sortBy) {
      paging += `&sortBy=${this._sortBy}`;
    }

    return paging;
  }
}
