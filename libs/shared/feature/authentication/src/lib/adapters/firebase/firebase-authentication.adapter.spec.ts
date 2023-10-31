import { PlatformLocation } from '@angular/common';
import { fakeAsync } from '@angular/core/testing';
import { AngularFireAuth } from '@angular/fire/compat/auth';
import { MockService } from 'ng-mocks';
import { of } from 'rxjs';
import { FirebaseAuthenticationAdapter } from './firebase-authentication.adapter';

describe('FirebaseAuthenticationAdapter ', () => {
  let service: FirebaseAuthenticationAdapter;
  class AngularFireAuthMock {
    // Mock the behavior of the idToken method
    public idToken = jest.fn().mockReturnValue(of('mockToken'));
  }

  // Create an instance of the AngularFireAuthMock
  const angularFireAuthMock = new AngularFireAuthMock();
  beforeEach(() => {
    service = new FirebaseAuthenticationAdapter(
      MockService(PlatformLocation, {
        getBaseHrefFromDOM: () => '/',
      }),
      MockService(AngularFireAuth, {
        authState: of(null),
        createUserWithEmailAndPassword: (_email, _password) =>
          Promise.resolve({
            additionalUserInfo: null,
            credential: null,
            operationType: null,
            user: null,
          }),
        fetchSignInMethodsForEmail: (_email: string) => Promise.resolve(['password']),
        idTokenResult: of(angularFireAuthMock.idToken()),
        isSignInWithEmailLink: (_email: string) => Promise.resolve(true),
        sendPasswordResetEmail: () => Promise.resolve(),
        sendSignInLinkToEmail: () => Promise.resolve(),
        signInWithEmailAndPassword: (_email, _password) =>
          Promise.resolve({
            additionalUserInfo: null,
            credential: null,
            operationType: null,
            user: null,
          }),
        signInWithEmailLink: () => {
          return Promise.resolve({
            additionalUserInfo: null,
            credential: null,
            operationType: null,
            user: null,
          });
        },
        signOut: () => Promise.resolve(),
      }),
      {
        firebaseConfiguration: {
          firebase: {
            apiKey: 'api-key',
            authDomain: 'auth-domain',
          },
          tenantId: 'tenant-id',
        },
        sessionExpiration: {
          idleTimeSeconds: 60 * 30,
          sessionTimeSeconds: 60 * 60 * 18,
        },
      },
    );
  });

  it('should  initialized', () => {
    expect(service).toBeTruthy();
  });

  it('should checkUserEmail', fakeAsync(() => {
    service.checkUserEmail('a@a.com').subscribe(result => {
      expect(result).toEqual(true);
    });
  }));

  it('should createUserWithEmailAndPassword', () => {
    service.signUpWithEmailAndPassword('a@a.com', 'pwd').subscribe(result => {
      expect(result).toBeTruthy();
    });
  });

  it('should createUserWithEmailAndPassword', () => {
    service.signInWithEmailAndPassword('a@a.com', 'pwd').subscribe(result => {
      expect(result).toBeTruthy();
    });
  });

  it('should signUpWithEmailLink', () => {
    service.signUpWithEmailLink('a@a.com').subscribe(result => {
      expect(result).toBeTruthy();
    });
  });

  it('should signInWithEmailLink', () => {
    service.signInWithEmailLink().subscribe(result => {
      expect(result).toBeTruthy();
    });
  });

  it('should sendPasswordResetEmail', () => {
    service.sendPasswordResetEmail('a@a.com').subscribe(result => {
      expect(result).toBeTruthy();
    });
  });

  it('should signOut', () => {
    service.signOut().subscribe(result => {
      expect(result).toBeTruthy();
    });
  });

  it('should emit authenticated', () => {
    service.isAuthenticated$.subscribe(result => {
      expect(result).toBeTruthy();
    });
  });

  it('should return error type', () => {
    expect(service.errorType({ code: 'unknown', message: 'message' })).toEqual('generic');
    expect(service.errorType({ code: 'auth/email-already-in-use', message: 'message' })).toEqual('email-already-in-use');
    expect(service.errorType({ code: 'auth/invalid-email', message: 'message' })).toEqual('invalid-email');
    expect(service.errorType({ code: 'auth/user-disabled', message: 'message' })).toEqual('user-disabled');
    expect(service.errorType({ code: 'auth/user-not-found', message: 'message' })).toEqual('user-not-found');
    expect(service.errorType({ code: 'auth/weak-password', message: 'message' })).toEqual('weak-password');
    expect(service.errorType({ code: 'auth/wrong-password', message: 'message' })).toEqual('wrong-password');
  });
});
