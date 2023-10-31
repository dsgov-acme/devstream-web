import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { TransactionMock, TransactionModel } from '@dsg/shared/data-access/work-api';
import { FormTransactionService } from '@dsg/shared/feature/form-nuv';
import { LoggingService } from '@dsg/shared/utils/logging';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ConfirmationComponent } from './confirmation.component';

global.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));

describe('ConfirmationComponent', () => {
  let component: ConfirmationComponent;
  let fixture: ComponentFixture<ConfirmationComponent>;

  beforeAll(() => {
    TestBed.resetTestEnvironment();
    TestBed.initTestEnvironment(
      BrowserDynamicTestingModule,
      platformBrowserDynamicTesting(),
      { teardown: { destroyAfterEach: false } }, // required in formly tests
    );
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmationComponent, RouterTestingModule.withRoutes([]), NoopAnimationsModule],
      providers: [
        MockProvider(HttpClient),
        MockProvider(LoggingService),
        MockProvider(FormTransactionService, {
          loadTransactionDetails$: jest.fn().mockImplementation(() => of([])),
          transaction$: of(new TransactionModel(TransactionMock)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadApplicationId$', () => {
    it('should load the externalTransactionId', async () => {
      component.externalTransactionId$.subscribe(applicationId => {
        expect(applicationId).toEqual('mw');
      });
    });
  });
});
