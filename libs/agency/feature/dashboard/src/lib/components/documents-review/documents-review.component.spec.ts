import { ComponentFixture, fakeAsync, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserDynamicTestingModule, platformBrowserDynamicTesting } from '@angular/platform-browser-dynamic/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import {
  CustomerProvidedDocumentMock,
  DocumentRejectionReasonsMock,
  DocumentReviewStatusesMock,
  TransactionMock,
  TransactionMockWithDocuments,
} from '@dsg/shared/data-access/work-api';
import { EnumerationsStateService } from '@dsg/shared/feature/app-state';
import { DocumentFormService } from '@dsg/shared/feature/form-nuv';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingAdapter } from '@dsg/shared/utils/logging';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { TransactionDetailService } from '../transaction-detail/transaction-detail.service';
import { DocumentsReviewComponent } from './documents-review.component';

describe('DocumentsReviewComponent', () => {
  let component: DocumentsReviewComponent;
  let fixture: ComponentFixture<DocumentsReviewComponent>;

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
      imports: [DocumentsReviewComponent, NoopAnimationsModule, ReactiveFormsModule, FormsModule],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({ transactionId: 'transactionId' }),
            snapshot: {
              paramMap: {
                get: () => TransactionMockWithDocuments.id,
              },
              params: { transactionId: TransactionMockWithDocuments.id },
            },
          },
        },
        MockProvider(LoggingAdapter),
        MockProvider(NuverialSnackBarService),
        MockProvider(DocumentFormService),
        MockProvider(TransactionDetailService, {
          customerProvidedDocuments$: of(TransactionMockWithDocuments.customerProvidedDocuments ?? []),
          updateCustomerProvidedDocument: jest.fn().mockImplementation(() =>
            of(TransactionMock.id, CustomerProvidedDocumentMock.id, {
              ...CustomerProvidedDocumentMock,
              rejectionReasons: undefined,
              reviewStatus: 'NEW',
            }),
          ),
        }),
        MockProvider(EnumerationsStateService, {
          getEnumMap$: jest
            .fn()
            .mockImplementationOnce(() => of(DocumentReviewStatusesMock))
            .mockImplementationOnce(() => of(DocumentRejectionReasonsMock)),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentsReviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1);

    expect(results).toEqual(1);
  });

  it('should provide rejected reasons labels', () => {
    expect(component.rejectedReasonsLabels).toBeTruthy();
    expect(component.rejectedReasonsLabels['POOR_QUALITY']).toEqual('Poor Quality');
    expect(component.rejectedReasonsLabels['INCORRECT_TYPE']).toEqual('Incorrect Type');
    expect(component.rejectedReasonsLabels['DOES_NOT_SATISFY_REQUIREMENTS']).toEqual('Does Not Satisfy Requirements');
    expect(component.rejectedReasonsLabels['SUSPECTED_FRAUD']).toEqual('Suspected Fraud');
  });

  // write a test to check that the document review statuses options are set
  it('should provide document review statuses', done => {
    component.reviewReasonsSelectOptions$.subscribe(options => {
      expect(options).toBeTruthy();
      expect(options[0].key).toEqual('REJECTED');
      expect(options[0].displayTextValue).toEqual('Rejected');
      expect(options[1].key).toEqual('NEW');
      expect(options[1].displayTextValue).toEqual('New');
      expect(options[2].key).toEqual('ACCEPTED');
      expect(options[2].displayTextValue).toEqual('Accepted');
      expect(options[3].key).toEqual('PENDING');
      expect(options[3].displayTextValue).toEqual('Pending');

      done();
    });
  });

  describe('updateCustomerProvidedDocument$', () => {
    it('should update CustomerProvidedDocument', fakeAsync(async () => {
      const documents = TransactionMock.customerProvidedDocuments;
      const service = ngMocks.findInstance(TransactionDetailService);
      const spy = jest.spyOn(service, 'updateCustomerProvidedDocument');

      if (documents) {
        component.formGroup.get(documents[0].id)?.valueChanges.subscribe(() => {
          component.formGroup.get(documents[0].id)?.setValue('NEW');
          expect(spy).toBeCalled();
        });
      }
    }));
  });

  describe('openDocument$', () => {
    it('should handle error when document file data is not retrieved', done => {
      jest.spyOn(component['_documentFormService'], 'openDocument$').mockReturnValue(throwError(() => ({ status: 404 })));

      const notifyApplicationErrorSpy = jest.spyOn(component['_nuverialSnackBarService'], 'notifyApplicationError');

      component.openDocument('test-id');

      expect(notifyApplicationErrorSpy).toHaveBeenCalledWith('Document information could not be retrieved.');
      done();
    });
  });
});
