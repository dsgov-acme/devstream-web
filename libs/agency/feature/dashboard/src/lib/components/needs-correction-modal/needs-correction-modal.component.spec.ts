import { ComponentFixture, TestBed, fakeAsync } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { CustomerProvidedDocumentMock, DocumentRejectionReasonsMock, TransactionMock, TransactionMockWithDocuments } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { LoggingAdapter } from '@dsg/shared/utils/logging';
import { MockProvider, ngMocks } from 'ng-mocks';
import { distinctUntilChanged, of, tap } from 'rxjs';
import { TransactionDetailService } from '../transaction-detail/transaction-detail.service';
import { NeedsCorrectionModalComponent } from './needs-correction-modal.component';

describe('NeedsCorrectionModalComponent', () => {
  let component: NeedsCorrectionModalComponent;
  let fixture: ComponentFixture<NeedsCorrectionModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NeedsCorrectionModalComponent, NoopAnimationsModule, ReactiveFormsModule, FormsModule],
      providers: [
        MockProvider(LoggingAdapter),
        MockProvider(NuverialSnackBarService),
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            rejectedReasons: [
              {
                displayTextValue: 'Does Not Satisfy Requirements',
                key: 'DOES_NOT_SATISFY_REQUIREMENTS',
              },
              { displayTextValue: 'Incorrect Type', key: 'INCORRECT_TYPE' },
              { displayTextValue: 'Poor Quality', key: 'POOR_QUALITY' },
              { displayTextValue: 'Suspected Fraud', key: 'SUSPECTED_FRAUD' },
            ],
          },
        },
        { provide: MatDialogRef, useValue: {} },
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
        MockProvider(TransactionDetailService, {
          getDocumentRejectionReasons$: jest.fn().mockReturnValue(of(DocumentRejectionReasonsMock)),
          updateCustomerProvidedDocument: jest.fn().mockImplementation(() =>
            of(TransactionMock.id, CustomerProvidedDocumentMock.id, {
              ...CustomerProvidedDocumentMock,
              rejectionReasons: undefined,
              reviewStatus: 'NEW',
            }),
          ),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NeedsCorrectionModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('saveNeedsCorrection', () => {
    it('should saveNeedsCorrection', fakeAsync(async () => {
      const service = ngMocks.findInstance(TransactionDetailService);
      const spy = jest.spyOn(service, 'updateCustomerProvidedDocument');
      component.formGroup.get('rejectionReason')?.valueChanges.subscribe(_ => {
        component.saveNeedsCorrection();
        expect(spy).toBeCalledTimes(1);
      });
    }));
    it('should saveNeedsCorrection', fakeAsync(async () => {
      const service = ngMocks.findInstance(TransactionDetailService);
      const spy = jest.spyOn(service, 'updateCustomerProvidedDocument');
      component.formGroup.get('rejectionReason')?.valueChanges.subscribe(_ => {
        component.saveNeedsCorrection();
        expect(spy).toBeCalledWith(component.data.transactionId);
      });
    }));
  });
  describe('removeSelectedReason', () => {
    it('should remove the selected reason', async () => {
      const reason = {
        disabled: false,
        displayTextValue: 'Document Incomplete',
        key: 'documentIncomplete',
        selected: false,
      };
      const initialSelectedReasonsLength = component.selectedReasons?.length;
      component.removeSelectedReason(reason);
      expect(component.selectedReasons?.length).toBeLessThanOrEqual(initialSelectedReasonsLength || 0);
    });
  });

  describe('setSelectedReason', () => {
    it('should get the document rejection reasons to populate the dropdown', () => {
      expect(component.rejectionReasonSelectOptions[0].displayTextValue).toEqual('Does Not Satisfy Requirements');
      expect(component.rejectionReasonSelectOptions[0].key).toEqual('DOES_NOT_SATISFY_REQUIREMENTS');
      expect(component.rejectionReasonSelectOptions[0].selected).toEqual(false);
    });
    it('should set the selected reason', async () => {
      component.formGroup
        .get('rejectionReason')
        ?.valueChanges.pipe(
          distinctUntilChanged(),
          tap(value => {
            expect(component.selectedReasons).toContain(value);
          }),
        )
        .subscribe();
    });
    it('should find a matching reason based on the form control key', async () => {
      component.formGroup
        .get('rejectionReason')
        ?.valueChanges.pipe(
          distinctUntilChanged(),
          tap(value => {
            expect(component.rejectionReasonSelectOptions.find(reason => reason.key === value)).toBeTruthy();
          }),
        )
        .subscribe();
    });
  });
});
