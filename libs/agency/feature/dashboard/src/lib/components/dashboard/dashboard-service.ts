import { Injectable } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { DashboardModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { BehaviorSubject, Observable, combineLatest, distinctUntilChanged, map, of, switchMap, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly _dashboards: BehaviorSubject<DashboardModel[]> = new BehaviorSubject<DashboardModel[]>([]);

  constructor(
    private readonly _workApiRoutesService: WorkApiRoutesService,
    private readonly _router: Router,
    private readonly _activatedRoute: ActivatedRoute,
  ) {}

  public getDashboards$(): Observable<DashboardModel[]> {
    if (this._dashboards.value.length) {
      return of(this._dashboards.value);
    }

    return this._workApiRoutesService.getDashboards$().pipe(
      tap(dashboards => {
        this._dashboards.next(dashboards);
      }),
    );
  }

  public loadDashboard$() {
    return combineLatest([
      this.getDashboards$(),
      this._activatedRoute.queryParamMap.pipe(
        map(params => params.get('transactionSet') ?? ''),
        distinctUntilChanged(),
      ),
    ]).pipe(
      switchMap(([dashboards, transactionSet]) => {
        if (!dashboards.length) return of(undefined);

        const selectedDashboard = dashboards.find(dashboard => dashboard.transactionSet === transactionSet);
        if (!transactionSet || !selectedDashboard) {
          this._router.navigate([], {
            queryParams: { transactionSet: dashboards[0].transactionSet } as Params,
            queryParamsHandling: 'merge',
            relativeTo: this._activatedRoute,
          });
        }

        return selectedDashboard ? of(selectedDashboard) : of(dashboards[0]);
      }),
    );
  }

  public cleanUp() {
    this._dashboards.next([]);
  }
}
