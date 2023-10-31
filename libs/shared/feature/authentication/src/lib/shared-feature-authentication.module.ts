import { CommonModule } from '@angular/common';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { APP_INITIALIZER, ModuleWithProviders, NgModule } from '@angular/core';
import { TENANT_ID } from '@angular/fire/compat/auth';
import { AngularFireAuthGuard } from '@angular/fire/compat/auth-guard';
import { RouterModule } from '@angular/router';
import { IEnvironment } from '@dsg/shared/utils/environment';
import { FirebaseAuthenticationAdapter } from './adapters';
import { AuthenticationTokenInterceptor } from './interceptors';
import { ADAPTER_AUTHENTICATION, AuthenticationAdapter } from './models';
import { AuthenticationService } from './services';
import { sharedClientAuthenticationRoutes } from './shared-client-authentication.routes';

const authenticationInitializer = {
  deps: [AuthenticationService],
  multi: true,
  provide: APP_INITIALIZER,
  useFactory: (authenticationService: AuthenticationService) => () => authenticationService.initialize(),
};

@NgModule({
  exports: [RouterModule],
  imports: [CommonModule, RouterModule.forChild(sharedClientAuthenticationRoutes)],
  providers: [
    authenticationInitializer,
    {
      multi: true,
      provide: HTTP_INTERCEPTORS,
      useClass: AuthenticationTokenInterceptor,
    },
  ],
})
export class SharedFeatureAuthenticationModule {
  public static useFirebaseAuthenticationAdapter(environment: IEnvironment): ModuleWithProviders<SharedFeatureAuthenticationModule> {
    return {
      ngModule: SharedFeatureAuthenticationModule,
      providers: [
        AngularFireAuthGuard,
        {
          provide: ADAPTER_AUTHENTICATION,
          useValue: environment.authenticationConfiguration,
        },
        {
          provide: AuthenticationAdapter,
          useClass: FirebaseAuthenticationAdapter,
        },
        { provide: TENANT_ID, useValue: environment.authenticationConfiguration.firebaseConfiguration.tenantId },
      ],
    };
  }
}
