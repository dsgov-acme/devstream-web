import { HttpClient } from '@angular/common/http';
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ActivatedRoute, ParamMap, Router, convertToParamMap } from '@angular/router';
import { DashboardList, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { MockProvider } from 'ng-mocks';
import { ReplaySubject, of, tap } from 'rxjs';
import { DashboardService } from './dashboard-service';

describe('DashboardService', () => {
  let service: DashboardService;
  let queryParamMap: ReplaySubject<ParamMap>;

  beforeEach(() => {
    queryParamMap = new ReplaySubject<ParamMap>(1);
    queryParamMap.next(convertToParamMap({ transactionSet: 'VehicalRegistration' }));

    TestBed.configureTestingModule({
      providers: [
        MockProvider(HttpClient),
        MockProvider(NuverialSnackBarService),
        MockProvider(WorkApiRoutesService, {
          getDashboards$: jest.fn().mockReturnValue(of(DashboardList)),
        }),
        {
          provide: Router,
          useValue: {
            navigate: jest.fn(),
          },
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: queryParamMap.asObservable(),
          },
        },
      ],
    });
    service = TestBed.inject(DashboardService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getDashboards$', () => {
    it('should not make a request to fetch getDashboards on the second call if the dashboards are already present in the subject', fakeAsync(() => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      const spy = jest.spyOn(workApiRoutesService, 'getDashboards$');

      service
        .getDashboards$()
        .pipe(
          tap(() => {
            expect(spy).toHaveBeenCalledTimes(1);
          }),
        )
        .subscribe();
      tick();

      service
        .getDashboards$()
        .pipe(
          tap(() => {
            // spy should still only been called 1 time since the second time it should return the dashboards from the subject
            expect(spy).toHaveBeenCalledTimes(1);
          }),
        )
        .subscribe();
      tick();
    }));
  });

  describe('loadDashboard$', () => {
    it('should return undefined if there are no dashboards', done => {
      const workApiRoutesService = TestBed.inject(WorkApiRoutesService);
      jest.spyOn(workApiRoutesService, 'getDashboards$').mockImplementation(() => of([]));

      service
        .loadDashboard$()
        .pipe(
          tap(dashboard => {
            expect(dashboard).toBeUndefined();
            done();
          }),
        )
        .subscribe();
    });

    it('should return the first dashboard if query param transactionSet is undefined', done => {
      queryParamMap.next(convertToParamMap({}));

      service
        .loadDashboard$()
        .pipe(
          tap(dashboard => {
            expect(dashboard).toBe(DashboardList[0]);
            done();
          }),
        )
        .subscribe();
    });

    it('should return the first dashboard if the dashboard corresponding to the transactionSet is not found', done => {
      queryParamMap.next(convertToParamMap({ transactionSet: 'NotFound' }));

      service
        .loadDashboard$()
        .pipe(
          tap(dashboard => {
            expect(dashboard).toBe(DashboardList[0]);
            done();
          }),
        )
        .subscribe();
    });

    it('should return the corresponding dashboard when matched with the query param transactionSet', done => {
      queryParamMap.next(convertToParamMap({ transactionSet: 'VehicalRegistration' }));

      const selectedDashboard = DashboardList.find(dashboard => dashboard.transactionSet === 'VehicalRegistration');

      service
        .loadDashboard$()
        .pipe(
          tap(dashboard => {
            expect(dashboard).toBe(selectedDashboard);
            done();
          }),
        )
        .subscribe();
    });
  });

  describe('cleanUp', () => {
    it('should set the dashboards subject to an empty array', fakeAsync(() => {
      service.loadDashboard$().subscribe();
      tick();

      expect(service['_dashboards'].value.length).toBeGreaterThan(0);
      service.cleanUp();
      expect(service['_dashboards'].value.length).toEqual(0);
    }));
  });
});
