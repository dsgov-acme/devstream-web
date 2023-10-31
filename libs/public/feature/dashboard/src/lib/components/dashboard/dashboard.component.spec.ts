import { ComponentFixture } from '@angular/core/testing';
import { ITransaction, TransactionMock, TransactionMock2, TransactionMock3, TransactionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialButtonComponent, NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { render, screen } from '@testing-library/angular';
import { axe } from 'jest-axe';
import { MockBuilder, MockProvider, ngMocks } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { DashboardService } from '../../services';
import { DashboardComponent } from './dashboard.component';

const transactions: TransactionModel[] = [
  new TransactionModel(TransactionMock),
  new TransactionModel(TransactionMock2),
  new TransactionModel(TransactionMock3),
];

const dependencies = MockBuilder(DashboardComponent)
  .keep(NuverialButtonComponent)
  .provide(
    MockProvider(WorkApiRoutesService, {
      createTransaction$: jest.fn().mockImplementation(() => of(new TransactionModel(TransactionMock))),
    }),
  )
  .provide(
    MockProvider(DashboardService, {
      getTransactions$: () => of(transactions),
    }),
  )
  .build();

const getFixture = async (props: Record<string, Record<string, unknown>>) => {
  const { fixture } = await render(DashboardComponent, {
    ...dependencies,
    ...props,
  });

  return { fixture };
};

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;

  beforeEach(async () => {
    fixture = (await getFixture({})).fixture;
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have no accessibility violations', async () => {
    const results = await axe(fixture.nativeElement);

    expect(results).toHaveNoViolations();
  });

  it('trackByFn', async () => {
    const results = component.trackByFn(1, {});

    expect(results).toEqual({});
  });

  describe('transactions$', () => {
    it('should get all transactions', async () => {
      expect(screen.getByText('Transaction ID: MW')).toBeInTheDocument();
      expect(screen.getByText('One or more documents require correction')).toBeInTheDocument();
      expect(screen.getByText('documents.proofOfIncome')).toBeInTheDocument();
    });

    describe('createNewTransaction', () => {
      it('should create a transaction', async () => {
        const service = ngMocks.findInstance(WorkApiRoutesService);
        const spy = jest.spyOn(service, 'createTransaction$');

        component.createNewTransaction();

        expect(spy).toHaveBeenCalled();
      });

      it('should handle create transaction error', async () => {
        const wmService = ngMocks.findInstance(WorkApiRoutesService);
        const spy = jest.spyOn(wmService, 'createTransaction$').mockImplementation(() => throwError(() => new Error('an error')));
        const snackBarService = ngMocks.findInstance(NuverialSnackBarService);
        const snackBarSpy = jest.spyOn(snackBarService, 'notifyApplicationError');

        component.createNewTransaction();

        expect(spy).toHaveBeenCalled();
        expect(snackBarSpy).toHaveBeenCalled();
      });

      it('should check if a transaction has rejected documents', () => {
        const transactionWithRejectedDocs: ITransaction = {
          ...TransactionMock,
          customerProvidedDocuments: [
            {
              active: true,
              dataPath: 'documents.proofOfIncome',
              id: 'b30504e1-8ae2-4507-9b7f-7fd5fc72a917',
              isErrorTooltipOpen: false,
              rejectionReasons: ['POOR_QUALITY'],
              reviewStatus: 'REJECTED',
              reviewedBy: 'b5cec816-6aee-4648-b0a9-eba91b2b0168',
              reviewedOn: '2023-08-17T21:41:31.518951Z',
              transaction: 'a84f0223-be08-48c0-96cd-a34655eda6f2',
            },
          ],
        };
        const transactionWithoutRejectedDocs: ITransaction = {
          ...TransactionMock,
          customerProvidedDocuments: [
            {
              active: true,
              dataPath: 'documents.proofOfIncome',
              id: '61da1bb9-6c31-42ca-9ba5-da74cd9b5358',
              isErrorTooltipOpen: false,
              rejectionReasons: [],
              reviewStatus: 'ACCEPTED',
              reviewedBy: 'b5cec816-6aee-4648-b0a9-eba91b2b0168',
              reviewedOn: '2023-08-17T21:41:31.518951Z',
              transaction: 'a84f0223-be08-48c0-96cd-a34655eda6f2',
            },
          ],
        };

        const hasRejectedDocsTrue = component.hasRejectedDocuments(transactionWithRejectedDocs);
        const hasRejectedDocsFalse = component.hasRejectedDocuments(transactionWithoutRejectedDocs);

        expect(hasRejectedDocsTrue).toBe(true);
        expect(hasRejectedDocsFalse).toBe(false);
      });
    });
  });
});
