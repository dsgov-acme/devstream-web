import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { PagingRequestModel } from '@dsg/shared/data-access/http';
import { UserMock, UserModel } from '@dsg/shared/data-access/user-api';
import {
  FormConfigurationModel,
  FormioConfigurationTestMock,
  ITransactionActiveTask,
  TransactionMock,
  TransactionMockWithDocuments,
  TransactionModel,
  TransactionPrioritiesMock,
} from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import { FormTransactionService } from '@dsg/shared/feature/form-nuv';
import { INuverialSelectOption, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider, ngMocks } from 'ng-mocks';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { TransactionDetailComponent } from './transaction-detail.component';
import { TransactionDetailService } from './transaction-detail.service';

const userModelMock = new UserModel(UserMock);
const transactionModelMock = new TransactionModel(TransactionMock);

describe('TransactionDetailComponent', () => {
  let component: TransactionDetailComponent;
  let fixture: ComponentFixture<TransactionDetailComponent>;
  let transactionAvailableActions: BehaviorSubject<ITransactionActiveTask | undefined>;

  beforeEach(async () => {
    transactionAvailableActions = new BehaviorSubject<ITransactionActiveTask | undefined>(undefined);

    await TestBed.configureTestingModule({
      imports: [TransactionDetailComponent, NoopAnimationsModule],
      providers: [
        MockProvider(HttpClient),
        MockProvider(LoggingService),
        MockProvider(NuverialSnackBarService),
        MockProvider(FormTransactionService, {
          formConfiguration$: of(new FormConfigurationModel(FormioConfigurationTestMock)),
          loadTransactionDetails$: jest.fn().mockImplementation(() => of([{}, { subjectUserId: 'testId' }])),
          transaction$: of(new TransactionModel(transactionModelMock)),
        }),
        MockProvider(TransactionDetailService, {
          initialize$: jest.fn().mockImplementation(() => of([{}, { subjectUserId: 'testId' }])),
          loadAgencyUsers$: jest.fn().mockImplementation(() => of([userModelMock])),
          loadUser$: jest.fn().mockImplementation(() => of(userModelMock)),
          reviewTransaction$: jest.fn().mockImplementation(() => of({})),
          transactionActiveTask$: transactionAvailableActions.asObservable(),
          transactionId: 'testId',
          updateTransactionAssignedTo$: jest.fn().mockImplementation(() => of({})),
          updateTransactionPriority$: jest.fn().mockImplementation(() => of({})),
          user$: of(userModelMock),
        }),
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of(convertToParamMap({ transactionId: 'testId' })),
            params: of({ transactionId: 'transactionId' }),
            snapshot: {
              paramMap: {
                get: () => TransactionMockWithDocuments.id,
              },
              params: { transactionId: TransactionMockWithDocuments.id },
              queryParams: {},
            },
          },
        },
        MockProvider(EnumerationsStateService, {
          getEnumMap$: jest.fn().mockReturnValue(of(TransactionPrioritiesMock)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TransactionDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('initialize$', () => {
    it('should load the transaction details', async () => {
      const service = ngMocks.findInstance(TransactionDetailService);
      const spy = jest.spyOn(service, 'initialize$');

      expect(spy).toBeCalledWith('testId');
    });

    it('should handle error loading transaction details', async () => {
      const service = ngMocks.findInstance(TransactionDetailService);
      const spy = jest.spyOn(service, 'initialize$').mockImplementation(() => throwError(() => new Error('an error')));
      const snackBarService = ngMocks.findInstance(NuverialSnackBarService);
      const snackBarSpy = jest.spyOn(snackBarService, 'notifyApplicationError');

      component.loadTransactionDetails$?.subscribe();

      expect(spy).toHaveBeenCalledWith('testId');
      expect(snackBarSpy).toHaveBeenCalled();
    });
  });

  describe('domChecks', () => {
    it('transaction detail should render when a user is found', async () => {
      if (userModelMock.displayName) {
        expect(fixture.nativeElement.querySelector('.user-details .user-name').textContent).toBe(userModelMock.displayName);
      }
    });

    it('should display an id when user model is not found', async () => {
      if (!userModelMock.displayName) {
        expect(fixture.nativeElement.querySelector('.user-details .user-name--not-found').textContent).toBe(transactionModelMock.subjectUserId);
      }
    });

    it('should display "N/A" when user model is not found', async () => {
      if (!userModelMock.displayName) {
        expect(fixture.nativeElement.querySelector('.user-details .user-name').textContent).toBe('N/A');
      }
    });
  });

  describe('priority select', () => {
    let selectedOption: INuverialSelectOption;

    beforeAll(() => {
      selectedOption = {
        color: 'var(--theme-color-priority-medium)',
        disabled: false,
        displayTextValue: 'Medium',
        key: 'MEDIUM',
        prefixIcon: 'drag_handle',
        selected: false,
      };
      selectedOption.selected = true;
    });

    it('should call updateTransactionPriority when handlePriority is triggered', async () => {
      const service = ngMocks.findInstance(TransactionDetailService);
      const transactionDetailServiceSpy = jest.spyOn(service, 'updateTransactionPriority$');

      component.handlePriority(selectedOption);

      expect(transactionDetailServiceSpy).toBeCalledWith('MEDIUM');
    });

    it('should call notifyApplicationError on error when updating priority', async () => {
      const service = ngMocks.findInstance(TransactionDetailService);
      const nuverialSnackBarService = ngMocks.findInstance(NuverialSnackBarService);

      jest.spyOn(service, 'updateTransactionPriority$').mockReturnValue(throwError(() => new Error('')));
      const notifyApplicationSuccessSpy = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');
      component.handlePriority(selectedOption);

      expect(notifyApplicationSuccessSpy).toBeCalled();
    });

    it('should provide sorted priorities select options, with wanted colors and icons', done => {
      component.prioritySelectOptionsSorted$.subscribe(options => {
        expect(options).toBeTruthy();
        expect(options[0].key).toEqual('LOW');
        expect(options[0].displayTextValue).toEqual('Low');
        expect(options[0].prefixIcon).toEqual('remove');
        expect(options[0].color).toEqual('var(--theme-color-priority-low)');
        expect(options[1].key).toEqual('MEDIUM');
        expect(options[1].displayTextValue).toEqual('Medium');
        expect(options[1].prefixIcon).toEqual('drag_handle');
        expect(options[1].color).toEqual('var(--theme-color-priority-medium)');
        expect(options[2].key).toEqual('HIGH');
        expect(options[2].displayTextValue).toEqual('High');
        expect(options[2].prefixIcon).toEqual('menu');
        expect(options[2].color).toEqual('var(--theme-color-priority-high)');
        expect(options[3].key).toEqual('URGENT');
        expect(options[3].displayTextValue).toEqual('Urgent');
        expect(options[3].prefixIcon).toEqual('error');
        expect(options[3].color).toEqual('var(--theme-color-priority-urgent)');

        done();
      });
    });
  });

  describe('assign agent to transaction', () => {
    it('should call notifyApplicationError on error when updating assignTo', async () => {
      const service = ngMocks.findInstance(TransactionDetailService);
      const nuverialSnackBarService = ngMocks.findInstance(NuverialSnackBarService);

      jest.spyOn(service, 'updateTransactionAssignedTo$').mockReturnValue(throwError(() => new Error('')));
      const notifyApplicationSuccessSpy = jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');
      component.handleAssignedTo('testId');

      expect(notifyApplicationSuccessSpy).toBeCalled();
    });

    it('should call handleAssignTo with an empty string when handleUnassign is called', async () => {
      const spy = jest.spyOn(component, 'handleAssignedTo');
      component.handleUnassign();

      expect(spy).toBeCalledWith('');
    });

    it('should call loadAgencyUsers$ from transactionDetailService with the firstName/lastName filters if search param contains a valid string', async () => {
      const service = ngMocks.findInstance(TransactionDetailService);

      const loadAgencyUsersSpy$ = jest.spyOn(service, 'loadAgencyUsers$');

      component.handleSearchAgent('John');

      const pagingRequestModel = new PagingRequestModel({
        pageSize: 5,
      });

      const expectedFilters = [{ field: 'name', value: 'John' }];
      expect(loadAgencyUsersSpy$).toBeCalledWith(expectedFilters, pagingRequestModel);
    });
  });

  it('should call reviewTransaction$ with the correct parameters and show success notification', () => {
    const transactionDetailService = ngMocks.findInstance(TransactionDetailService);
    const nuverialSnackBarService = ngMocks.findInstance(NuverialSnackBarService);

    jest.spyOn(transactionDetailService, 'reviewTransaction$');
    jest.spyOn(nuverialSnackBarService, 'notifyApplicationSuccess');
    component.activeTaskId = 'testTaskId';
    component.onActionClick('testEvent');

    expect(transactionDetailService.reviewTransaction$).toHaveBeenCalledWith('testEvent', 'testTaskId');
    expect(nuverialSnackBarService.notifyApplicationSuccess).toHaveBeenCalled();
  });

  it('should show error notification if reviewTransaction$ throws an error', () => {
    const transactionDetailService = ngMocks.findInstance(TransactionDetailService);
    const nuverialSnackBarService = ngMocks.findInstance(NuverialSnackBarService);

    jest.spyOn(transactionDetailService, 'reviewTransaction$').mockReturnValue(throwError(() => new Error('')));
    jest.spyOn(nuverialSnackBarService, 'notifyApplicationError');
    component.activeTaskId = 'testTaskId';
    component.onActionClick('testEvent');

    expect(transactionDetailService.reviewTransaction$).toHaveBeenCalledWith('testEvent', 'testTaskId');
    expect(nuverialSnackBarService.notifyApplicationError).toHaveBeenCalledWith('Error updating transaction status');
  });
});
