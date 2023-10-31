import { PlatformLocation } from '@angular/common';
import { Inject, Injectable, Optional } from '@angular/core';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { IAuthenticationConfiguration } from '@dsg/shared/utils/environment';
import firebase from 'firebase/compat/app';
import { Observable, ReplaySubject, from, of, shareReplay, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import {
  ADAPTER_AUTHENTICATION,
  AuthenticationAdapter,
  AuthenticationProviderErrorType,
  FIREBASE_ERROR_MAP,
  IAuthenticatedError,
  IAuthenticatedUser,
  IAuthenticatedUserCredential,
} from '../../models';

@Injectable()
export class FirebaseAuthenticationAdapter implements AuthenticationAdapter {
  public user$: Observable<IAuthenticatedUser | null>;
  public isAuthenticated$: Observable<boolean>;
  public isAuthenticated = false;
  public userToken$: Observable<string | null>;
  public sessionExpired$: Observable<boolean>;

  protected readonly _sessionExpired: ReplaySubject<boolean> = new ReplaySubject<boolean>(1);
  private readonly _tokenData: ReplaySubject<firebase.auth.IdTokenResult> = new ReplaySubject<firebase.auth.IdTokenResult>(1);

  constructor(
    protected readonly _platformLocation: PlatformLocation,
    private readonly _angularFireAuth: AngularFireAuth,
    @Optional() @Inject(ADAPTER_AUTHENTICATION) protected readonly _configuration: IAuthenticationConfiguration,
  ) {
    const authState: Observable<IAuthenticatedUser | null> = this._angularFireAuth.authState.pipe(
      map(user =>
        user
          ? {
              displayName: user.displayName,
              email: user.email,
              phoneNumber: user.phoneNumber,
              photoURL: user.photoURL,
              providerId: user.providerId,
              uid: user.uid,
            }
          : null,
      ),
      shareReplay(1),
    );

    this.isAuthenticated$ = authState.pipe(
      map(user => user !== null && user !== undefined),
      tap(authenticated => (this.isAuthenticated = authenticated)),
    );
    this.user$ = authState;
    this.userToken$ = this._angularFireAuth.idToken;
    this.sessionExpired$ = this._sessionExpired.asObservable();

    this._initialize();
  }

  public checkUserEmail(email: string): Observable<boolean> {
    return from(this._angularFireAuth.fetchSignInMethodsForEmail(email)).pipe(
      map(methods => !!methods.find(() => 'password')),
      catchError(() => of(false)),
    );
  }

  public errorType(error: IAuthenticatedError): AuthenticationProviderErrorType {
    return FIREBASE_ERROR_MAP[error.code] ? FIREBASE_ERROR_MAP[error.code] : 'generic';
  }

  public signUpWithEmailAndPassword(email: string, password: string): Observable<IAuthenticatedUserCredential> {
    return from(this._angularFireAuth.createUserWithEmailAndPassword(email, password)).pipe(
      map(credential => ({
        additionalUserInfo: credential.additionalUserInfo,
        credential: credential.credential,
        operationType: credential.operationType,
        user: credential.user,
      })),
      catchError((error: firebase.FirebaseError) => {
        return throwError(() => ({
          code: error.code,
          message: error.message,
        }));
      }),
    );
  }

  public signInWithEmailAndPassword(email: string, password: string): Observable<IAuthenticatedUserCredential> {
    return from(this._angularFireAuth.signInWithEmailAndPassword(email, password)).pipe(
      map(credential => ({
        additionalUserInfo: credential.additionalUserInfo,
        credential: credential.credential,
        operationType: credential.operationType,
        user: credential.user,
      })),
      catchError((error: firebase.FirebaseError) => {
        return throwError(() => ({
          code: error.code,
          message: error.message,
        }));
      }),
    );
  }

  public signUpWithEmailLink(email: string): Observable<void> {
    const actionCodeSettings = {
      // URL you want to redirect back to. The domain (www.example.com) for this
      // URL must be in the authorized domains list in the Firebase Console.
      handleCodeInApp: true,
      url: `${window.location.origin}${this._platformLocation.getBaseHrefFromDOM()}login/complete-sign-in`,
    };

    return from(this._angularFireAuth.sendSignInLinkToEmail(email, actionCodeSettings)).pipe(
      tap(() => {
        window.localStorage.setItem('emailForSignIn', email);
      }),
    );
  }

  public signInWithEmailLink(): Observable<IAuthenticatedUserCredential> {
    if (!this._angularFireAuth.isSignInWithEmailLink(window.location.href)) {
      throw new Error('code: unknown, message: invalid email link');
    }

    const email = window.localStorage.getItem('emailForSignIn');
    if (!email) {
      throw new Error('code: unknown, message: email address not found');
    }

    return from(this._angularFireAuth.signInWithEmailLink(email, window.location.href)).pipe(
      tap(() => {
        window.localStorage.removeItem('emailForSignIn');
      }),
      map(credential => ({
        additionalUserInfo: credential.additionalUserInfo,
        credential: credential.credential,
        operationType: credential.operationType,
        user: credential.user,
      })),
      catchError((error: firebase.FirebaseError) => {
        return throwError(() => ({
          code: error.code,
          message: error.message,
        }));
      }),
    );
  }

  public sendPasswordResetEmail(email: string): Observable<void> {
    return from(this._angularFireAuth.sendPasswordResetEmail(email));
  }

  public signOut(): Observable<void> {
    return from(this._angularFireAuth.signOut()).pipe(tap(() => (this.isAuthenticated = false)));
  }

  protected _initialize(): void {
    this._angularFireAuth.idTokenResult
      .pipe(
        tap(tokenData => {
          if (!tokenData) return;

          this._tokenData.next(tokenData);

          if (!tokenData || !this._configuration?.sessionExpiration?.sessionTimeSeconds) {
            return;
          }

          const tokenAuthTime = new Date(tokenData.authTime).getTime();
          const authExpiryDate = Date.now() - this._configuration.sessionExpiration.sessionTimeSeconds * 1000;

          if (tokenAuthTime < authExpiryDate) {
            this._sessionExpired.next(true);
          }
        }),
      )
      .subscribe();
  }
}
