import { fakeAsync, flush } from '@angular/core/testing';
import { Router } from '@angular/router';
import { PortalApiRoutesService } from '@dsg/shared/data-access/portal-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { MockService } from 'ng-mocks';
import { Subject, of, take, throwError } from 'rxjs';
import { AuthenticationAdapter } from '../../models/authentication.adapter';
import { SessionTimeoutService } from '../session-timeout/session-timeout.service';
import { AuthenticationService } from './authentication.service';

describe('AuthenticationService', () => {
  let adapter: AuthenticationAdapter;
  let apiService: PortalApiRoutesService;
  let service: AuthenticationService;
  let timeoutService: SessionTimeoutService;
  let router: Router;
  let snackBarService: NuverialSnackBarService;
  let userStateService: UserStateService;
  let enumsService: EnumerationsStateService;
  const _isAuthenticated = new Subject<boolean>();

  beforeEach(() => {
    adapter = MockService(AuthenticationAdapter, {
      checkUserEmail: jest.fn(),
      errorType: jest.fn().mockImplementation(() => 'invalid-email'),
      isAuthenticated$: _isAuthenticated.asObservable(),
      sendPasswordResetEmail: jest.fn(),
      sessionExpired$: of(false),
      signInWithEmailAndPassword: jest.fn(),
      signInWithEmailLink: jest.fn(),
      signOut: jest.fn().mockImplementation(() => of(undefined)),
      signUpWithEmailAndPassword: jest.fn().mockImplementation(() => of(undefined)),
      signUpWithEmailLink: jest.fn(),
    });
    apiService = MockService(PortalApiRoutesService, {
      postSignOut$: jest.fn().mockImplementation(() => of(undefined)),
    });
    timeoutService = MockService(SessionTimeoutService, {
      watchForIdle: jest.fn().mockImplementation(() => of(false)),
    });
    router = MockService(Router);
    snackBarService = MockService(NuverialSnackBarService);
    userStateService = MockService(UserStateService);
    enumsService = MockService(EnumerationsStateService);
    service = new AuthenticationService(router, adapter, timeoutService, {}, apiService, snackBarService, userStateService, enumsService);
  });

  it('should  initialized', () => {
    expect(service).toBeTruthy();
  });

  it('should provide authentication status', () => {
    expect(service.isAuthenticated).toBeFalsy();
  });

  it('should checkUserEmail', fakeAsync(() => {
    const spy = jest.spyOn(adapter, 'checkUserEmail').mockImplementation();
    service.checkUserEmail('a@a.com');
    expect(spy).toHaveBeenCalledWith('a@a.com');
  }));

  it('should error type', () => {
    const spy = jest.spyOn(adapter, 'errorType').mockImplementation();
    service.errorString({ code: 'abc', message: '123' });
    expect(spy).toHaveBeenCalled();
  });

  it('should createUserWithEmailAndPassword', () => {
    const spy = jest.spyOn(adapter, 'signUpWithEmailAndPassword').mockImplementation();
    service.createUserWithEmailAndPassword('a@a.com', 'pwd');
    expect(spy).toHaveBeenCalledWith('a@a.com', 'pwd');
  });

  it('should createUserWithEmailAndPassword', () => {
    const spy = jest.spyOn(adapter, 'signInWithEmailAndPassword').mockImplementation();
    service.signInWithEmailAndPassword('a@a.com', 'pwd');
    expect(spy).toHaveBeenCalledWith('a@a.com', 'pwd');
  });

  it('should signInWithEmailLink', () => {
    const spy = jest.spyOn(adapter, 'signInWithEmailLink').mockImplementation();
    service.signInWithEmailLink();
    expect(spy).toHaveBeenCalled();
  });

  it('should signUpWithEmailLink', () => {
    const spy = jest.spyOn(adapter, 'signUpWithEmailLink').mockImplementation();
    service.signUpWithEmailLink('a@a.com');
    expect(spy).toHaveBeenCalled();
  });

  it('should sendPasswordResetEmail', () => {
    const spy = jest.spyOn(adapter, 'sendPasswordResetEmail').mockImplementation();
    service.sendPasswordResetEmail('a@a.com');
    expect(spy).toHaveBeenCalledWith('a@a.com');
  });

  it('should signOut', fakeAsync(() => {
    const spyApi = jest.spyOn(apiService, 'postSignOut$');
    const spyAdapter = jest.spyOn(adapter, 'signOut');
    const userStateServiceSpy = jest.spyOn(userStateService, 'clearUserState');
    const enumsStateServiceSpy = jest.spyOn(enumsService, 'clearEnumsState');

    service
      .signOut()
      .pipe(take(1))
      .subscribe(_ => {
        expect(spyApi).toHaveBeenCalled();
        expect(spyAdapter).toHaveBeenCalled();
        expect(userStateServiceSpy).toHaveBeenCalled();
        expect(enumsStateServiceSpy).toHaveBeenCalled();
      });
    flush();
  }));

  it('should signOut with api error', fakeAsync(() => {
    const spyApi = jest.spyOn(apiService, 'postSignOut$').mockImplementation(() => {
      return throwError(() => ({
        code: '1234',
        message: 'error message',
      }));
    });
    const spyAdapter = jest.spyOn(adapter, 'signOut');
    service
      .signOut()
      .pipe(take(1))
      .subscribe(_ => {
        expect(spyApi).toHaveBeenCalled();
        expect(spyAdapter).toHaveBeenCalled();
      });

    flush();
  }));

  it('should have default error messages', () => {
    expect(service.errorString({ code: 'invalid-email', message: 'message' })).toEqual('This is not a valid email address. Please verify and try again');
  });

  it('should have configured  error messages', () => {
    service = new AuthenticationService(
      router,
      adapter,
      timeoutService,
      {
        providerErrorLanguage: {
          'email-already-in-use': 'provided email-already-in-use',
          'generic': 'provided generic',
          'invalid-email': 'provided invalid-email',
          'user-disabled': 'provided user-disabled',
          'user-not-found': 'provided user-not-found',
          'weak-password': 'provided weak-password',
          'wrong-password': 'provided wrong-password',
        },
      },
      apiService,
      snackBarService,
      userStateService,
      enumsService,
    );
    expect(service.errorString({ code: 'invalid-email', message: 'message' })).toEqual('provided invalid-email');
  });

  describe('Initialize', () => {
    it('should clear the idle session cache', () => {
      const spy = jest.spyOn(timeoutService, 'reset');

      service.initialize();
      _isAuthenticated.next(false);

      expect(spy).toHaveBeenCalled();
    });

    it('should start watching for idle and initialize user state', () => {
      const timeoutServiceSpy = jest.spyOn(timeoutService, 'watchForIdle');
      const userStateServiceSpy = jest.spyOn(userStateService, 'initializeUser');
      const enumsStateServiceSpy = jest.spyOn(enumsService, 'initializeEnumerations');

      service.initialize();
      _isAuthenticated.next(true);

      expect(timeoutServiceSpy).toHaveBeenCalled();
      expect(userStateServiceSpy).toHaveBeenCalled();
      expect(enumsStateServiceSpy).toHaveBeenCalled();
    });
  });
});
