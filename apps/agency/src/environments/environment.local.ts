import { IEnvironment, WindowWithEnvironment } from '@dsg/shared/utils/environment';

declare let window: WindowWithEnvironment;

const _environment: IEnvironment = {
  authenticationConfiguration: {
    firebaseConfiguration: {
      firebase: {
        apiKey: 'AIzaSyBb5I7J5yd_e0vL0iuiPrlykv-WQMtgAbw',
        authDomain: 'dsgov-dev.firebaseapp.com',
      },
      tenantId: 'agency-portal-ug493',
    },
    sessionExpiration: {
      idleTimeSeconds: 60 * 30,
      sessionTimeSeconds: 60 * 60 * 18,
    },
  },
  httpConfiguration: {
    baseUrl: 'http://api.dsgov.test',
  },
};

export const environment: IEnvironment = {
  ..._environment,
  ...window.environment, // must be last
};
