import { Injectable } from '@angular/core';
import {
  FormConfigurationModel,
  IForm,
  IFormConfigurationSchema,
  IRendererFormConfigurationSchema,
  ITransactionMetaData,
  TransactionMetadataModel,
  WorkApiRoutesService,
} from '@dsg/shared/data-access/work-api';
import { FormioForm } from '@formio/angular';
import { Observable, ReplaySubject, map } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FormBuilderService {
  /** The initial loaded form components from the api */
  private readonly _initialFormComponents: ReplaySubject<FormConfigurationModel> = new ReplaySubject(1);
  /** The updated form components, not yet saved to the api */
  private readonly _updatedFormComponents: ReplaySubject<FormConfigurationModel> = new ReplaySubject(1);
  private readonly _formMetaData: ReplaySubject<TransactionMetadataModel> = new ReplaySubject(1);

  private _formWrapper!: IForm;

  constructor(private readonly _workApiRoutesService: WorkApiRoutesService) {}

  /** Map the form configuration to the intake form configuration */
  public intakeFormFields$: Observable<IRendererFormConfigurationSchema[]> = this._updatedFormComponents
    .asObservable()
    .pipe(map(formConfigurationModel => structuredClone(formConfigurationModel.toIntakeForm())));

  /** Map the form configuration to the review form configuration */
  public reviewFormFields$: Observable<IRendererFormConfigurationSchema[]> = this._updatedFormComponents
    .asObservable()
    .pipe(map(formConfigurationModel => structuredClone(formConfigurationModel.toReviewForm())));

  public metaDataFields$: Observable<ITransactionMetaData> = this._formMetaData.asObservable();

  /** Get the form configuration from the api and map to the formio builder form json*/
  public getFormConfigurationByKey$(transactionDefinitionKey: string, formKey: string): Observable<FormioForm> {
    const observable = this._workApiRoutesService.getFormConfigurationByKey$(transactionDefinitionKey, formKey);

    return this.processFormConfigurationObservable(observable, transactionDefinitionKey, formKey);
  }

  private processFormConfigurationObservable(_observable$: Observable<IForm>, transactionDefinitionKey: string, formKey: string): Observable<FormioForm> {
    return _observable$.pipe(
      map(formConfigurationWrapper => {
        this._formWrapper = formConfigurationWrapper;
        this._formWrapper.transactionDefinitionKey = transactionDefinitionKey;
        this._formWrapper.formKey = formKey;
        const formConfigurationModel = new FormConfigurationModel(formConfigurationWrapper.configuration.components);
        const transactionMetaDataModel = new TransactionMetadataModel(formConfigurationWrapper);
        this._initialFormComponents.next(formConfigurationModel);
        this._updatedFormComponents.next(formConfigurationModel);
        this._formMetaData.next(transactionMetaDataModel);

        return formConfigurationModel;
      }),
      map(formConfigurationModel => structuredClone(formConfigurationModel.toFormioBuilderForm())),
    );
  }

  /** Clean up the form json and store the updated form,
   * also converts the formio json to formly json
   */
  public updateFormComponents(formComponents: IFormConfigurationSchema[]): {
    formioJson: IFormConfigurationSchema[];
    formlyJson: IRendererFormConfigurationSchema[];
  } {
    const formConfigurationModel = new FormConfigurationModel(formComponents, true);
    this._updatedFormComponents.next(formConfigurationModel);

    return {
      formioJson: formConfigurationModel.toFormioJson(),
      formlyJson: formConfigurationModel.toFormlyJson(),
    };
  }

  /** Clean up the form json and store the updated form,
   * also converts the formio json to formly json
   */
  public updateFormConfiguration(formComponents: IFormConfigurationSchema[], transactionDefinitionKey: string, formKey: string): Observable<FormioForm> {
    this._formWrapper.configuration.components = formComponents;
    const observable$ = this._workApiRoutesService.updateFormConfiguration$(this._formWrapper, transactionDefinitionKey, formKey);

    return this.processFormConfigurationObservable(observable$, transactionDefinitionKey, formKey);
  }

  public updateMetaData(metaData: ITransactionMetaData): Observable<ITransactionMetaData> {
    this._formWrapper.name = metaData.name;
    this._formWrapper.schemaKey = metaData.schemaKey;
    this._formWrapper.description = metaData.description;
    const updateFormConfiguration$ = this._workApiRoutesService.updateFormConfiguration$(
      this._formWrapper,
      metaData.transactionDefinitionKey,
      metaData.formKey,
    );

    return updateFormConfiguration$.pipe(
      map(formConfiguration => {
        formConfiguration.transactionDefinitionKey = metaData.transactionDefinitionKey;
        formConfiguration.formKey = metaData.formKey;
        const transactionMetaDataModel = new TransactionMetadataModel(formConfiguration);

        return transactionMetaDataModel;
      }),
      map(formConfigurationModel => structuredClone(formConfigurationModel.toSchema())),
    );
  }
}
