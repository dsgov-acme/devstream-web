import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { FormConfigurationModel, FormioConfigurationTestMock, TransactionMock, TransactionModel } from '@dsg/shared/data-access/work-api';
import { DocumentFormService, FormTransactionService } from '@dsg/shared/feature/form-nuv';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider } from 'ng-mocks';
import { ReplaySubject, of } from 'rxjs';
import { ReadonlyComponent, StatusLabelColors } from './readonly.component';

const formConfigurationModel = new FormConfigurationModel(FormioConfigurationTestMock);
const transactionModelMock = new TransactionModel(TransactionMock);

describe('ReadonlyComponent', () => {
  let component: ReadonlyComponent;
  let fixture: ComponentFixture<ReadonlyComponent>;
  let transaction: ReplaySubject<TransactionModel>;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  beforeEach(async () => {
    transaction = new ReplaySubject<TransactionModel>(1);

    await TestBed.configureTestingModule({
      imports: [ReadonlyComponent, RouterTestingModule.withRoutes([]), NoopAnimationsModule],
      providers: [
        MockProvider(LoggingService),
        MockProvider(NuverialSnackBarService),
        MockProvider(DocumentFormService),
        MockProvider(HttpClient),
        MockProvider(FormTransactionService, {
          formConfiguration$: of(formConfigurationModel),
          transaction$: transaction.asObservable(),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ReadonlyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('reviewFormFields$', () => {
    it('should load review form configuration', done => {
      component.reviewFormFields$?.subscribe(formConfiguration => {
        expect(formConfiguration).toEqual(formConfigurationModel.toReviewForm());

        done();
      });
    });
  });

  describe('statusLabelColorClass', () => {
    it('should be StatusLabelColors.Black', () => {
      expect(component.statusLabelColorClass).toEqual(StatusLabelColors.Black);
    });

    it('should be StatusLabelColors.Green', () => {
      transaction.next(new TransactionModel({ ...TransactionMock, status: 'Approved' }));

      component.transaction$?.subscribe();

      expect(component.statusLabelColorClass).toEqual(StatusLabelColors.Green);
    });

    it('should be StatusLabelColors.Red', () => {
      transaction.next(new TransactionModel({ ...TransactionMock, status: 'Denied' }));

      component.transaction$?.subscribe();

      expect(component.statusLabelColorClass).toEqual(StatusLabelColors.Red);
    });
  });

  describe('externalTransactionId', () => {
    it('should be empty', () => {
      expect(component.externalTransactionId).toEqual('');
    });

    it('should be the externalId of the transaction', () => {
      transaction.next(new TransactionModel({ ...TransactionMock, externalId: 'externalTestId' }));

      component.transaction$?.subscribe();

      expect(component.externalTransactionId).toEqual('externalTestId');
    });
  });

  describe('formData$', () => {
    it('should be the data of the transaction', done => {
      transaction.next(new TransactionModel({ ...TransactionMock, data: { test: 'test' } }));

      component.formData$?.subscribe(formData => {
        expect(formData).toEqual({ test: 'test' });

        done();
      });
    });
  });

  describe('domChecks', () => {
    it('should display transaction name', async () => {
      transaction.next(transactionModelMock);
      fixture.detectChanges();

      const headerTitle = fixture.debugElement.query(By.css('[data-testid=header-title]'));
      expect(headerTitle.nativeElement.textContent.trim()).toBe(transactionModelMock.transactionDefinitionName);
    });

    it('should display an transaction submission date', async () => {
      transaction.next(transactionModelMock);
      fixture.detectChanges();

      const pipe = new DatePipe('en');
      const expectedSubmitDate = pipe.transform(transactionModelMock.submittedOn, 'MM/dd/yyyy hh:mm a');
      const headerSubmitDate = fixture.debugElement.query(By.css('[data-testid=header-submit-date]'));
      expect(headerSubmitDate.nativeElement.textContent.trim()).toBe(`Submitted: ${expectedSubmitDate}`);
    });

    it('should display transaction status', async () => {
      transaction.next(transactionModelMock);
      fixture.detectChanges();

      const headerStatusLabel = fixture.debugElement.query(By.css('[data-testid=header-status-label]'));
      expect(headerStatusLabel.nativeElement.textContent.trim()).toBe(transactionModelMock.status);
    });
  });
});
