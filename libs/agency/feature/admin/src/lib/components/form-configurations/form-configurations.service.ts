import { Injectable } from '@angular/core';
import { IForm, ITransactionMetaData, WorkApiRoutesService } from '@dsg/shared/data-access/work-api';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FormConfigurationService {
  constructor(private readonly _workApiRoutesService: WorkApiRoutesService) {}

  public updateMetaData(metaData: ITransactionMetaData): Observable<IForm> {
    const formConfiguration: Partial<IForm> = {
      configuration: {
        components: [],
      },
      configurationSchema: 'formio',
      description: metaData.description,
      formKey: '',
      name: metaData.name,
      schemaKey: metaData.schemaKey,
      transactionDefinitionKey: '',
    };

    return this._workApiRoutesService.updateFormConfiguration$(formConfiguration, metaData.transactionDefinitionKey, metaData.formKey);
  }
}
