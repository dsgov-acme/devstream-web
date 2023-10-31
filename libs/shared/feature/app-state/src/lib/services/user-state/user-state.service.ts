import { Injectable } from '@angular/core';
import { DEFAULT_LOCALE } from '@dsg/shared/data-access/portal-api';
import { IUsersPaginationResponse, UserApiRoutesService, UserModel, UserPreferencesModel } from '@dsg/shared/data-access/user-api';
import { LRUCache } from 'lru-cache';
import { catchError, forkJoin, map, Observable, of, ReplaySubject, take, tap } from 'rxjs';
import { isUserId } from './user.util';

@Injectable({
  providedIn: 'root',
})
export class UserStateService {
  private readonly _cacheOptions = {
    allowStale: false, // return stale items before removing from cache?
    max: 200,
    maxSize: 2000000, // for use with tracking overall storage size
    sizeCalculation: (value: UserModel, key: string) => key.length + JSON.stringify(value).length,
    updateAgeOnGet: true,
    updateAgeOnHas: false,
  };

  private readonly _user: ReplaySubject<UserModel | null> = new ReplaySubject<UserModel | null>(1);
  public user$: Observable<UserModel | null> = this._user?.asObservable();

  // private readonly _usersMap: Map<string, UserModel> = new Map<string, UserModel>();
  private readonly _usersCache: LRUCache<string, UserModel> = new LRUCache<string, UserModel>(this._cacheOptions);

  constructor(protected readonly _userApiRoutesService: UserApiRoutesService) {}

  /**
   * Loads the initial user state
   */
  public initializeUser() {
    this.getUser$().pipe(take(1)).subscribe();
  }

  /**
   * Loads an initial users cache with agency users
   */
  public initializeUsersCache$(): Observable<IUsersPaginationResponse<UserModel>> {
    return this._userApiRoutesService.getUsers$([{ field: 'userType', value: 'agency' }]).pipe(
      tap(usersSchema => {
        usersSchema.users.forEach((user: UserModel) => {
          this._usersCache.set(user.id, user);
        });
      }),
    );
  }

  /**
   * Clear the user state variables
   */
  public clearUserState() {
    this._user.next(null);
    this._usersCache.clear();
  }

  /**
   * Get the currentUser and set the user accordingly
   */
  public getUser$(): Observable<UserModel> {
    return this._userApiRoutesService.getUser$().pipe(
      tap(user => {
        this._user.next(user);
      }),
    );
  }

  /**
   * Get the user from the cache first and then from the api
   */
  public getUserById$(userId?: string): Observable<UserModel | undefined> {
    if (!userId || !isUserId(userId)) return of(undefined);

    const user = this._usersCache.get(userId);

    if (!user) {
      return this._userApiRoutesService.getUserById$(userId).pipe(
        tap(userModel => this._usersCache.set(userId, userModel)),
        catchError(_error => {
          return of(undefined);
        }),
      );
    }

    return of(user);
  }

  /**
   * Get the displayName from the users cache
   */
  public getUserDisplayName$(userId?: string): Observable<string> {
    if (!userId) return of('');

    return this.getUserById$(userId).pipe(map(user => user?.displayName || userId));
  }

  /**
   * Set the currentUser when createUpdateProfile is called
   */
  public saveUser$(payload: UserModel): Observable<UserModel> {
    payload.preferences.preferredLanguage = payload.preferences.preferredLanguage || DEFAULT_LOCALE;
    const preferences = new UserPreferencesModel(payload.preferences);

    const updateUserPreferences$ = this._userApiRoutesService.createUpdateUserPreferences$(payload.id, preferences);
    const updateUserProfile$ = this._userApiRoutesService.createUpdateProfile$(payload);

    // `concat` returns the last value from the provided observables. Use `last` to ensure the user model is returned
    return forkJoin([updateUserPreferences$, updateUserProfile$]).pipe(
      map(([_, user]) => user),
      tap(user => {
        this._user.next(user);
      }),
    );
  }
}
