import { InjectionToken } from '@angular/core';

export interface IFirebaseConfiguration {
  firebase: {
    apiKey: string;
    authDomain: string;
  };
  tenantId: string;
}

export interface IAuthenticationConfiguration {
  firebaseConfiguration: IFirebaseConfiguration;
  sessionExpiration: {
    idleTimeSeconds: number | null;
    sessionTimeSeconds: number | null;
  };
}

export interface IHTTPConfiguration {
  baseUrl: string;
}

export interface IEnvironment {
  authenticationConfiguration: IAuthenticationConfiguration;
  httpConfiguration: IHTTPConfiguration;
}

export interface WindowWithEnvironment extends Window {
  environment: IEnvironment;
}

export const ENVIRONMENT_CONFIGURATION = new InjectionToken<IEnvironment>('ENVIRONMENT_CONFIGURATION');
