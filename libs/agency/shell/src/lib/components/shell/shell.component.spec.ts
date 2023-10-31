import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Event, NavigationEnd, Router } from '@angular/router';
import { DashboardService } from '@dsg/agency/feature/dashboard';
import { AgencyFeatureProfileService } from '@dsg/agency/feature/profile';
import { AgencyUsersMock, UserModel } from '@dsg/shared/data-access/user-api';
import { DashboardList } from '@dsg/shared/data-access/work-api';
import { UserStateService } from '@dsg/shared/feature/app-state';
import { AuthenticationService } from '@dsg/shared/feature/authentication';
import { NuverialMenuOptions } from '@dsg/shared/ui/nuverial';
import { axe } from 'jest-axe';
import { MockProvider } from 'ng-mocks';
import { of, Subject, tap } from 'rxjs';
import { ShellComponent } from './shell.component';

function getUserProfile(): UserModel {
  const user = new UserModel();
  user.displayName = 'John Doe';
  user.email = 'john.doe@example.com';

  return user;
}

describe('ShellComponent', () => {
  let component: ShellComponent;
  let fixture: ComponentFixture<ShellComponent>;
  let routerEventsSubject: Subject<Event>;
  beforeEach(async () => {
    routerEventsSubject = new Subject<Event>();

    await TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        MockProvider(AuthenticationService, {
          isAuthenticated$: of(true),
          signOut: jest.fn(),
        }),
        MockProvider(UserStateService, {
          initializeUsersCache$: jest.fn().mockImplementation(() => of(AgencyUsersMock)),
        }),
        MockProvider(AgencyFeatureProfileService, {
          getProfile$: jest.fn().mockImplementation(() => of(getUserProfile())),
        }),
        MockProvider(Router, {
          events: routerEventsSubject.asObservable(),
          url: '/dashboard',
        }),
        MockProvider(DashboardService, {
          getDashboards$: jest.fn().mockImplementation(() => of(DashboardList)),
        }),
        MockProvider(ActivatedRoute),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ShellComponent);
    component = fixture.componentInstance;
  });

  it('should create', async () => {
    expect(fixture).toBeTruthy();
  });

  it('should set userAuthenticated$ to true when authenticated', done => {
    component.userAuthenticated$.subscribe((val: boolean) => {
      expect(val).toEqual(true);
      done();
    });
  });

  it('should have no accessibility violations', async () => {
    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });

  it('should logout', async () => {
    const service = TestBed.inject(AuthenticationService);
    const spy = jest.spyOn(service, 'signOut').mockImplementation(() => of(undefined));
    fixture.componentInstance.onMenuItemSelect(NuverialMenuOptions.LOGOUT);
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should load user profile information', async () => {
    const service = TestBed.inject(AgencyFeatureProfileService);
    const spy = jest.spyOn(service, 'getProfile$');
    fixture.componentInstance.ngOnInit();
    expect(spy).toHaveBeenCalled();
    expect(fixture.componentInstance.profileMenuItemList[0].label).toEqual('John Doe');
    expect(fixture.componentInstance.profileMenuItemList[0].subTitle).toEqual('john.doe@example.com');
  });

  it('should not trigger auth service profile', done => {
    const service = TestBed.inject(AuthenticationService);
    const userStateservice = TestBed.inject(UserStateService);
    const spy = jest.spyOn(service, 'signOut').mockImplementation(() => of(undefined));
    userStateservice.initializeUsersCache$().subscribe(_ => {
      fixture.componentInstance.onMenuItemSelect(NuverialMenuOptions.PROFILE);
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
      done();
    });
  });

  it('should not trigger auth service on preferences', async () => {
    const service = TestBed.inject(AuthenticationService);
    const spy = jest.spyOn(service, 'signOut').mockImplementation(() => of(undefined));
    fixture.componentInstance.onMenuItemSelect(NuverialMenuOptions.PREFERENCES);
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('should set agencySideNavMenuItems$ based on dashboard configs', done => {
    const dashboardService = TestBed.inject(DashboardService);
    const spy = jest.spyOn(dashboardService, 'getDashboards$');

    component.ngOnInit();
    expect(component.agencySideNavMenuItems$).toBeDefined();

    if (component.agencySideNavMenuItems$) {
      component.agencySideNavMenuItems$
        .pipe(
          tap(agencyMenu => {
            expect(agencyMenu).toBeDefined();
            expect(agencyMenu).toStrictEqual([
              {
                icon: 'search',
                navigationParams: { transactionSet: 'FinancialBenefit' },
                navigationRoute: 'dashboard',
              },
              {
                icon: 'search',
                navigationParams: { transactionSet: 'VehicalRegistration' },
                navigationRoute: 'dashboard',
              },
            ]);

            done();
          }),
        )
        .subscribe();
    }

    expect(spy).toHaveBeenCalled();
  });

  describe('_setPortalByURL', () => {
    it('should set isAdminPortal to true and portalNavigator route to dashboard if _router.url contains "admin"', fakeAsync(() => {
      Object.defineProperty(component['_router'], 'url', {
        get: () => '/admin',
      });

      component['_setPortalByURL']();
      expect(component.portalNavigator?.navigationRoute).toEqual('dashboard');
      expect(component.isAdminPortal).toEqual(true);
    }));

    it('should set isAdminPortal to false and portalNavigator route to admin if _router.url does not contains "admin"', fakeAsync(() => {
      Object.defineProperty(component['_router'], 'url', {
        get: () => '/dashboard',
      });

      component['_setPortalByURL']();
      expect(component.portalNavigator?.navigationRoute).toEqual('admin');
      expect(component.isAdminPortal).toEqual(false);
    }));

    it('should call _setPortalByURL when a NavigationEnd event is emitted', fakeAsync(() => {
      component.ngOnInit();
      const spy = jest.spyOn(component as any, '_setPortalByURL');

      routerEventsSubject.next(new NavigationEnd(1, 'test', 'test'));
      tick();

      expect(spy).toHaveBeenCalled();
    }));
  });
});
