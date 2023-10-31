import { Injectable } from '@angular/core';
import { PagingRequestModel } from '@dsg/shared/data-access/http';
import { FormConfigurationModel, TransactionModel, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { NuverialSnackBarService } from '@dsg/shared/ui/nuverial';
import { Observable, catchError, concatMap, from, map, of, toArray } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private readonly _transactionDefinitionFormModelMap: Map<string, FormConfigurationModel> = new Map();
  private readonly _pagination = new PagingRequestModel({
    sortBy: 'lastUpdatedTimestamp',
    sortOrder: 'DESC',
  });

  private readonly _transactions$: Observable<TransactionModel[]> = this._workApiRoutesService.getAllTransactionsForUser$(this._pagination).pipe(
    concatMap(transactionWithPagination =>
      from(transactionWithPagination.items).pipe(
        concatMap(transactionItem => {
          const transactionModel = new TransactionModel(transactionItem);
          if (transactionModel.rejectedDocuments.length > 0 && !this._transactionDefinitionFormModelMap.has(transactionModel.transactionDefinitionKey)) {
            return this.getFormConfigurationById$(transactionModel.id).pipe(
              catchError(_error => of(null)),
              map(formModel => {
                if (formModel) {
                  this._transactionDefinitionFormModelMap.set(transactionModel.transactionDefinitionKey, formModel);
                  transactionModel.rejectedDocuments = transactionModel.rejectedDocuments.map(rejectedDocumentItem =>
                    formModel?.getComponentLabelByKey(rejectedDocumentItem),
                  );
                }

                return transactionModel;
              }),
            );
          } else {
            transactionModel.rejectedDocuments = transactionModel.rejectedDocuments.map(rejectedDocumentItem => {
              const componentLabel = this._transactionDefinitionFormModelMap
                .get(transactionModel.transactionDefinitionKey)
                ?.getComponentLabelByKey(rejectedDocumentItem);

              return componentLabel !== undefined ? componentLabel : rejectedDocumentItem;
            });

            return of(transactionModel);
          }
        }),
      ),
    ),
    toArray(),
    catchError(_error => {
      this._nuverialSnackBarService.notifyApplicationError();

      return of([]);
    }),
  );

  /**
   * loads the active form configuration of a given transaction
   * @param transactionId ID of the transaction
   * @returns an observable of the form configuration
   */
  public getFormConfigurationById$(transactionId: string): Observable<FormConfigurationModel> {
    return this._workApiRoutesService.getFormByTransactionId$(transactionId).pipe(map(formModel => formModel.formConfigurationModel));
  }

  constructor(private readonly _workApiRoutesService: WorkApiRoutesService, private readonly _nuverialSnackBarService: NuverialSnackBarService) {}

  public getTransactions$(): Observable<TransactionModel[]> {
    return this._transactions$;
  }
}
