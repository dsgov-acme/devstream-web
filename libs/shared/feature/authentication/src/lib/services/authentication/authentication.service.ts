import { Inject, Injectable, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { PortalApiRoutesService } from '@dsg/shared/data-access/portal-api';
import { EnumerationsStateService, UserStateService } from '@dsg/shared/feature/app-state';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { Observable, catchError, combineLatest, of, switchMap } from 'rxjs';
import { filter, map, startWith, tap } from 'rxjs/operators';
import {
  AuthenticationAdapter,
  AuthenticationProviderActions,
  CLIENT_AUTHENTICATION,
  DEFAULT_ERROR_LANGUAGE,
  DEFAULT_LANGUAGE,
  IAuthenticatedError,
  IAuthenticatedUser,
  IAuthenticatedUserCredential,
  IClientAuthenticationConfiguration,
} from '../../models';
import { SessionTimeoutService } from '../session-timeout/session-timeout.service';

const DEFAULT_SESSION_EXPIRED_REDIRECT = 'login';

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  public user$: Observable<IAuthenticatedUser | null> = this._authenticationAdapter.user$;
  public userToken$: Observable<string | null> = this._authenticationAdapter.userToken$;
  public isAuthenticated$: Observable<boolean> = this._authenticationAdapter.isAuthenticated$;

  protected _defaultErrorLanguage = DEFAULT_ERROR_LANGUAGE;
  protected _defaultSessionLanguage = DEFAULT_LANGUAGE[AuthenticationProviderActions.SessionExpired];

  constructor(
    protected readonly _router: Router,
    protected readonly _authenticationAdapter: AuthenticationAdapter,
    protected readonly _sessionTimeoutService: SessionTimeoutService,
    @Optional() @Inject(CLIENT_AUTHENTICATION) protected readonly _configuration: IClientAuthenticationConfiguration,
    protected readonly _portalApiRoutesService: PortalApiRoutesService,
    protected _nuverialSnackBarService: NuverialSnackBarService,
    protected _userStateService: UserStateService,
    protected _enumerationsStateService: EnumerationsStateService,
  ) {
    this._configure();
  }

  public get isAuthenticated(): boolean {
    return this._authenticationAdapter.isAuthenticated;
  }

  public checkUserEmail(email: string): Observable<boolean> {
    return this._authenticationAdapter.checkUserEmail(email);
  }

  public signInWithEmailLink(): Observable<IAuthenticatedUserCredential> {
    return this._authenticationAdapter.signInWithEmailLink();
  }

  public createUserWithEmailAndPassword(email: string, password: string): Observable<IAuthenticatedUserCredential> {
    return this._authenticationAdapter.signUpWithEmailAndPassword(email, password);
  }

  public signInWithEmailAndPassword(email: string, password: string): Observable<IAuthenticatedUserCredential> {
    return this._authenticationAdapter.signInWithEmailAndPassword(email, password);
  }

  public sendPasswordResetEmail(email: string): Observable<void> {
    return this._authenticationAdapter.sendPasswordResetEmail(email);
  }

  public signUpWithEmailLink(email: string): Observable<void> {
    return this._authenticationAdapter.signUpWithEmailLink(email);
  }

  public signOut(route: string = '/login'): Observable<void> {
    this._sessionTimeoutService.reset();

    return this._portalApiRoutesService
      .postSignOut$()
      .pipe(catchError(_error => of(undefined)))
      .pipe(
        switchMap(() => this._authenticationAdapter.signOut()),
        tap(_ => {
          this._router.navigate([route], { queryParams: { status: 'signedOut' } });
          this._userStateService.clearUserState();
          this._enumerationsStateService.clearEnumsState();
          location.reload();
        }),
      );
  }

  public errorString(error: IAuthenticatedError): string {
    return this._defaultErrorLanguage[this._authenticationAdapter.errorType(error)];
  }

  protected _configure() {
    if (this._configuration?.providerErrorLanguage) {
      this._defaultErrorLanguage = { ...DEFAULT_ERROR_LANGUAGE, ...this._configuration?.providerErrorLanguage };
    }

    if (this._configuration?.language?.[AuthenticationProviderActions.SessionExpired]) {
      this._defaultSessionLanguage = {
        ...this._defaultSessionLanguage,
        ...this._configuration?.language?.[AuthenticationProviderActions.SessionExpired],
      };
    }
  }

  public initialize(): void {
    combineLatest([
      this._authenticationAdapter.sessionExpired$.pipe(
        filter(expired => expired),
        startWith(false),
      ),
      this.isAuthenticated$.pipe(
        // ensure that the idleTime cache is cleared when the user is un authenticated, this prevents the user from edge case sign out immediately after sign in
        tap(val => !val && this._sessionTimeoutService.reset()),
        filter(isAuthenticated => isAuthenticated),
        tap(_ => this._userStateService.initializeUser()),
        tap(_ => this._enumerationsStateService.initializeEnumerations()),
        switchMap(() => this._sessionTimeoutService.watchForIdle()),
        filter(expired => expired),
        startWith(false),
      ),
    ])
      .pipe(
        map(([sessionExpired, idleExpired]) => sessionExpired || idleExpired),
        filter(isExpired => isExpired),
        tap(_ => {
          this._nuverialSnackBarService.openConfigured({
            message: this._defaultSessionLanguage.sessionInactivityMessage,
            type: 'warn',
            verticalPosition: 'top',
          });

          this.signOut(this._configuration?.redirectOnSessionExpiration || DEFAULT_SESSION_EXPIRED_REDIRECT).subscribe();
        }),
      )
      .subscribe();
  }
}
