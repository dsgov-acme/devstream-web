import { ChangeDetectionStrategy, Component, Inject, OnInit, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap, take } from 'rxjs/operators';
import { AuthenticationProviderActions, AuthenticationProviderFlowType, CLIENT_AUTHENTICATION, IClientAuthenticationConfiguration } from '../../models';
import { AuthenticationEmailComponent } from '../authentication-email';
import { AuthenticationEmailCompleteComponent } from '../authentication-email-complete';
import { AuthenticationSignedOutComponent } from '../authentication-signed-out';

const DEFAULT_SIGNIN_REDIRECT = 'main/profile';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, AuthenticationEmailComponent, AuthenticationEmailCompleteComponent, AuthenticationSignedOutComponent],
  selector: 'dsg-authentication',
  standalone: true,
  styleUrls: ['./authentication.component.scss'],
  templateUrl: './authentication.component.html',
})
export class AuthenticationComponent implements OnInit {
  public actionReset: AuthenticationProviderActions | null = AuthenticationProviderActions.PasswordResetEmail;
  public authenticationAction: AuthenticationProviderActions = AuthenticationProviderActions.SignInWithEmailAndPassword;
  public authenticationActionSignIn: AuthenticationProviderActions = AuthenticationProviderActions.SignInWithEmailAndPassword;

  public activeComponent: 'authentication-email' | 'authentication-email-complete' | 'authentication-signed-out' = 'authentication-email';
  public returnUrl$!: Observable<string | null>;

  protected _authenticationProviderFlow: AuthenticationProviderFlowType = 'email-password';
  protected _returnUrl = DEFAULT_SIGNIN_REDIRECT;

  constructor(
    protected _route: ActivatedRoute,
    @Optional() @Inject(CLIENT_AUTHENTICATION) protected readonly _configuration: IClientAuthenticationConfiguration,
  ) {
    this._configure();
  }

  public ngOnInit(): void {
    this.returnUrl$ = this._route.queryParamMap.pipe(map(params => (params.has('returnUrl') ? params.get('returnUrl') : this._returnUrl)));
    this._route.queryParamMap
      .pipe(
        take(1),
        tap(params => {
          if (params.has('apiKey')) {
            this.onChangeAuthenticationProvider(AuthenticationProviderActions.SignInWithEmailLink);
          } else if (params.has('status') && params.get('status') === 'signedOut') {
            this.onChangeAuthenticationProvider(AuthenticationProviderActions.SignOut);
          }
        }),
      )
      .subscribe();
  }

  public onChangeAuthenticationProvider(event: AuthenticationProviderActions) {
    this.activeComponent = 'authentication-email';
    switch (event) {
      case AuthenticationProviderActions.PasswordResetEmail:
        this.actionReset = null;
        this.authenticationAction = AuthenticationProviderActions.PasswordResetEmail;
        this.authenticationActionSignIn = AuthenticationProviderActions.SignUpWithEmailAndPassword;
        break;
      case AuthenticationProviderActions.SignInWithEmailAndPassword:
        this.actionReset = AuthenticationProviderActions.PasswordResetEmail;
        this.authenticationAction = AuthenticationProviderActions.SignInWithEmailAndPassword;
        this.authenticationActionSignIn =
          this._authenticationProviderFlow === 'email-link'
            ? AuthenticationProviderActions.SignUpWithEmailLink
            : AuthenticationProviderActions.SignUpWithEmailAndPassword;
        break;
      case AuthenticationProviderActions.SignUpWithEmailAndPassword:
        this.actionReset = null;
        this.authenticationAction = AuthenticationProviderActions.SignUpWithEmailAndPassword;
        this.authenticationActionSignIn = AuthenticationProviderActions.SignInWithEmailAndPassword;
        break;
      case AuthenticationProviderActions.SignUpWithEmailLink:
        this.actionReset = null;
        this.authenticationAction = AuthenticationProviderActions.SignUpWithEmailLink;
        this.authenticationActionSignIn = AuthenticationProviderActions.SignInWithEmailAndPassword;
        break;
      case AuthenticationProviderActions.SignInWithEmailLink:
        this.activeComponent = 'authentication-email-complete';
        this.actionReset = null;
        this.authenticationAction = AuthenticationProviderActions.SignInWithEmailLink;
        this.authenticationActionSignIn = AuthenticationProviderActions.SignInWithEmailAndPassword;
        break;
      case AuthenticationProviderActions.SignOut:
        this.activeComponent = 'authentication-signed-out';
        this.actionReset = null;
        this.authenticationAction = AuthenticationProviderActions.SignOut;
        this.authenticationActionSignIn = AuthenticationProviderActions.SignInWithEmailAndPassword;
        break;
    }
  }

  protected _configure() {
    this._returnUrl = this._configuration?.redirectOnSignUpWithEmailLink || DEFAULT_SIGNIN_REDIRECT;
    this._authenticationProviderFlow = this._configuration?.authenticationProviderFlow || this._authenticationProviderFlow;
  }
}
