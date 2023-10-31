import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import {
  FormConfigurationModel,
  FormioConfigurationTestMock,
  TransactionMock2,
  TransactionMock3,
  TransactionModel,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { DashboardService } from './dashboard.service';

const formConfigurationModel = new FormConfigurationModel(FormioConfigurationTestMock);

describe('DashboardService', () => {
  let service: DashboardService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        MockProvider(WorkApiRoutesService, {
          getAllTransactionsForUser$: jest
            .fn()
            .mockImplementation(() =>
              of({ items: [new TransactionModel(TransactionMock2), new TransactionModel(TransactionMock3), new TransactionModel(TransactionMock3)] }),
            ),
          getFormByTransactionId$: jest.fn().mockImplementation(() => of(formConfigurationModel)),
        }),
        MockProvider(NuverialSnackBarService),
      ],
    });
    service = TestBed.inject(DashboardService);
  });

  it('should set the documents labels based on the form configuration', fakeAsync(() => {
    let emittedTransactions: TransactionModel[] | undefined;
    jest.spyOn(service as any, 'getFormConfigurationById$').mockReturnValue(of(formConfigurationModel));

    service.getTransactions$().subscribe(result => {
      emittedTransactions = result;
    });

    tick();

    expect(emittedTransactions).toBeDefined();
    expect(emittedTransactions?.length).toBe(3);

    if (emittedTransactions) {
      expect(emittedTransactions[0].rejectedDocuments.length).toBe(0);
      expect(emittedTransactions[1].rejectedDocuments).toEqual(['Proof of Income/Tax']);
      expect(emittedTransactions[2].rejectedDocuments).toEqual(['Proof of Income/Tax']);
    }
  }));

  it('should handle get all transactions error', async () => {
    const wmService = ngMocks.findInstance(WorkApiRoutesService);
    const spy = jest.spyOn(wmService, 'getAllTransactionsForUser$').mockImplementation(() => throwError(() => new Error('an error')));
    service.getTransactions$().subscribe();

    expect(spy).toHaveBeenCalled();
  });
});
