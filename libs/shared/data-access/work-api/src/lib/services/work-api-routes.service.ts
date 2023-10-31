/* istanbul ignore file */

import { HttpClient, HttpParams } from '@angular/common/http';
import { Inject, Injectable } from '@angular/core';
import { Filter, HttpBaseService, PagingRequestModel, PagingResponseModel } from '@dsg/shared/data-access/http';
import { ENVIRONMENT_CONFIGURATION, IEnvironment } from '@dsg/shared/utils/environment';
import { LoggingService } from '@dsg/shared/utils/logging';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { tap } from 'rxjs/operators';
import {
  ConfiguredEnums,
  FormModel,
  IActiveForm,
  ICustomerProvidedDocument,
  IForm,
  INote,
  INotesPaginationResponse,
  IProcessDocumentsResponse,
  ISchemaDefinition,
  ISchemasPaginationResponse,
  ITransaction,
  ITransactionDefinition,
  ITransactionStatusCount,
  ITransactionsPaginationResponse,
  NoteModel,
  ProcessDocumentsModel,
  SchemaDefinitionModel,
  TransactionDefinitionModel,
  TransactionModel,
  UpdateTransactionOptions,
} from '../models';
import { DashboardModel, IDashboard } from '../models/dashboard/dashboard.model';
import { ISchemaTreeDefinition, SchemaTreeDefinitionModel } from '../models/schema-tree/schema-tree.model';
import { IWorkflow, IWorkflowPaginationResponse, WorkflowModel } from '../models/workflow/workflow.model';

/**
 * This service is only used to expose endpoints, no logic should go in this service
 */
@Injectable({
  providedIn: 'root',
})
export class WorkApiRoutesService extends HttpBaseService {
  constructor(
    protected override readonly _http: HttpClient,
    @Inject(ENVIRONMENT_CONFIGURATION) protected readonly _environment: IEnvironment,
    protected override readonly _loggingService: LoggingService,
  ) {
    super(_http, `${_environment.httpConfiguration.baseUrl}/wm/api`, _loggingService);
  }

  private readonly _schemaTree: BehaviorSubject<SchemaTreeDefinitionModel> = new BehaviorSubject<SchemaDefinitionModel>(new SchemaDefinitionModel());
  public schemaTree$: Observable<SchemaTreeDefinitionModel> = this._schemaTree.asObservable();

  /**
   * Create or Update a form data schema definition
   */
  public createUpdateSchemaDefinition$(key: string, schemaDefinitionModel: SchemaDefinitionModel): Observable<SchemaDefinitionModel> {
    return this._handlePut$<ISchemaDefinition>(`/v1/admin/schemas/${key}`, schemaDefinitionModel.toSchema()).pipe(
      map(schemaDefinition => new SchemaDefinitionModel(schemaDefinition)),
    );
  }

  public getSchemaDefinitionByKey$(key: string): Observable<SchemaDefinitionModel> {
    return this._handleGet$<ISchemaDefinition>(`/v1/admin/schemas/${key}`).pipe(map(schemaDefinition => new SchemaDefinitionModel(schemaDefinition)));
  }

  /**
   * Get a list of form data schema definition
   */
  public getSchemaDefinitionList$(): Observable<SchemaDefinitionModel> {
    return this._handleGet$<ISchemaDefinition>(`/v1/admin/entity/schema`).pipe(map(schemaDefinition => new SchemaDefinitionModel(schemaDefinition)));
  }

  /**
   * Create or Update a transaction definition
   */
  public createUpdateTransactionDefinition$(key: string, transactionDefinitionModel: TransactionDefinitionModel): Observable<TransactionDefinitionModel> {
    return this._handlePut$<ITransactionDefinition>(`/v1/admin/transactions/${key}`, transactionDefinitionModel.toSchema()).pipe(
      map(transactionDefinition => new TransactionDefinitionModel(transactionDefinition)),
    );
  }

  /**
   * Get transaction definition by key
   */
  public getTransactionDefinitionByKey$(key: string): Observable<TransactionDefinitionModel> {
    return this._handleGet$<ITransactionDefinition>(`/v1/admin/transactions/${key}`).pipe(
      map(transactionDefinitionSchema => new TransactionDefinitionModel(transactionDefinitionSchema)),
    );
  }

  /**
   * Get all work manager enumerations
   */
  public getEnumerations$(): Observable<ConfiguredEnums> {
    return this._handleGet$<ConfiguredEnums>('/v1/enumerations').pipe();
  }

  /**
   * Get transactions
   */
  public getTransactionsList$(filters?: Filter[], pagingRequestModel?: PagingRequestModel): Observable<ITransactionsPaginationResponse<TransactionModel>> {
    let httpParams = new HttpParams();
    filters?.forEach(filter => {
      httpParams = httpParams.append(filter?.field, filter?.value);
    });

    return this._handleGet$<ITransactionsPaginationResponse<ITransaction>>(
      `/v1/transactions${pagingRequestModel ? pagingRequestModel.toSchema() : ''}`,
      filters
        ? {
            params: httpParams,
          }
        : '',
    ).pipe(
      map(transactionsSchema => ({
        items: transactionsSchema.items?.map(transactionSchema => new TransactionModel(transactionSchema)),
        pagingMetadata: new PagingResponseModel(transactionsSchema.pagingMetadata),
      })),
    );
  }

  /**
   * Get transaction definitions list
   */
  public getTransactionDefinitionsList$(
    filters?: Filter[],
    pagingRequestModel?: PagingRequestModel,
  ): Observable<ITransactionsPaginationResponse<ITransactionDefinition>> {
    let httpParams = new HttpParams();
    filters?.forEach(filter => {
      httpParams = httpParams.append(filter?.field, filter?.value);
    });

    return this._handleGet$<ITransactionsPaginationResponse<ITransactionDefinition>>(
      `/v1/admin/transactions${pagingRequestModel ? pagingRequestModel.toSchema() : ''}`,
      filters
        ? {
            params: httpParams,
          }
        : '',
    ).pipe(
      map(transactionsSchema => ({
        items: transactionsSchema.items?.map(transactionDefinition => new TransactionDefinitionModel(transactionDefinition)),
        pagingMetadata: new PagingResponseModel(transactionsSchema.pagingMetadata),
      })),
    );
  }

  /**
   * Get schemas list
   */
  public getSchemaDefinitionsList$(filters?: Filter[], pagingRequestModel?: PagingRequestModel): Observable<ISchemasPaginationResponse<ISchemaDefinition>> {
    let httpParams = new HttpParams();
    filters?.forEach(filter => {
      httpParams = httpParams.append(filter?.field, filter?.value);
    });

    return this._handleGet$<ISchemasPaginationResponse<ISchemaDefinition>>(
      `/v1/admin/schemas${pagingRequestModel ? pagingRequestModel.toSchema() : ''}`,
      filters
        ? {
            params: httpParams,
          }
        : '',
    ).pipe(
      map(schemas => ({
        items: schemas.items?.map(schemaDefinition => new SchemaDefinitionModel(schemaDefinition)),
        pagingMetadata: new PagingResponseModel(schemas.pagingMetadata),
      })),
    );
  }

  /**
   * Get schema tree from key
   */
  public getSchemaTree$(key: string): Observable<ISchemaTreeDefinition> {
    let httpParams = new HttpParams();
    httpParams = httpParams.append('includeChildren', true);

    return this._handleGet$<ISchemaTreeDefinition>(`/v1/admin/schemas/${key}`, {
      params: httpParams,
    }).pipe(
      map(response => new SchemaTreeDefinitionModel(response)),
      tap(schemaTree => this._schemaTree.next(schemaTree)),
    );
  }

  /**
   * Get workflows list
   */
  public getWorkflowsList$(pagingRequestModel?: PagingRequestModel): Observable<IWorkflowPaginationResponse<IWorkflow>> {
    return this._handleGet$<IWorkflowPaginationResponse<IWorkflow>>(`/v1/admin/workflows${pagingRequestModel ? pagingRequestModel.toSchema() : ''}`).pipe(
      map(schemas => ({
        items: schemas.items?.map(schemaDefinition => new WorkflowModel(schemaDefinition)),
        pagingMetadata: new PagingResponseModel(schemas.pagingMetadata),
      })),
    );
  }

  /**
   * Create a new transaction instance
   */
  public createTransaction$(transactionDefinitionKey: string): Observable<TransactionModel> {
    return this._handlePost$<ITransaction>(`/v1/transactions`, { transactionDefinitionKey }).pipe(
      map(transactionSchema => new TransactionModel(transactionSchema)),
    );
  }

  /**
   * Update transaction by id
   */
  public updateTransactionById$(data: UpdateTransactionOptions): Observable<TransactionModel> {
    return this._handlePut$<ITransaction>(`/v1/transactions/${data.transactionId}`, data.transaction, {
      params: {
        completeTask: data.completeTask ? 'true' : 'false',
        ...(data.formStepKey !== undefined && { formStepKey: data.formStepKey }),
        ...(data.taskId !== undefined && { taskId: data.taskId }),
      },
    }).pipe(map(transactionSchema => new TransactionModel(transactionSchema)));
  }

  /**
   * Get transaction by id
   */
  public getTransactionById$(transactionId: string): Observable<TransactionModel> {
    return this._handleGet$<ITransaction>(`/v1/transactions/${transactionId}`).pipe(map(transactionSchema => new TransactionModel(transactionSchema)));
  }

  /**
   * Update transaction customer provided documents
   */
  public updateTransactionDocumentsById$(
    transactionId: string,
    documentId: string,
    customerProvidedDocument: ICustomerProvidedDocument,
  ): Observable<ICustomerProvidedDocument> {
    return this._handlePut$<ICustomerProvidedDocument>(`/v1/transactions/${transactionId}/documents/${documentId}`, customerProvidedDocument).pipe(
      map(document => document),
    );
  }

  /**
   * Get all transactions for the authenticated user
   */
  public getAllTransactionsForUser$(paginationModel?: PagingRequestModel): Observable<ITransactionsPaginationResponse<TransactionModel>> {
    return this._handleGet$<ITransactionsPaginationResponse<ITransaction>>(`/v1/my-transactions${paginationModel ? paginationModel.toSchema() : ''}`).pipe(
      map(transactionsSchema => ({ ...transactionsSchema, items: transactionsSchema.items.map(transactionSchema => new TransactionModel(transactionSchema)) })),
    );
  }

  /**
   * Get active form metadata for a transaction, if a taskName is not provided this will return the form for the first task
   */
  public getFormByTransactionId$(transactionId: string, taskName?: string): Observable<FormModel> {
    return this._handleGet$<IActiveForm>(`/v1/transactions/${transactionId}/active-forms`).pipe(
      map(activeForms => {
        const _taskName = taskName ?? Object.keys(activeForms)[0];

        return new FormModel({
          ...activeForms[_taskName],
          configuration: activeForms[_taskName].configuration,
          taskName: _taskName,
        });
      }),
    );
  }

  /**
   * Get all statuses for the transactions and counts for each
   */
  public getTransactionStatuses$(): Observable<ITransactionStatusCount[]> {
    return this._handleGet$<ITransactionStatusCount[]>(`/v1/transactions/statuses/count`).pipe(map(statuses => statuses));
  }

  /**
   * Get form configuration from the api
   */
  public getFormConfigurations$(transactionDefinitionKey: string): Observable<IForm[]> {
    return this._handleGet$<IForm[]>(`/v1/admin/transactions/${transactionDefinitionKey}/forms`).pipe();
  }

  /**
   * Get form configuration from the api
   */
  public getFormConfigurationByKey$(transactionDefinitionKey: string, formKey: string): Observable<IForm> {
    return this._handleGet$<IForm>(`/v1/admin/transactions/${transactionDefinitionKey}/forms/${formKey}`).pipe();
  }

  /**
   * upsert the form configuration in the api
   */
  public updateFormConfiguration$(formWrapper: Partial<IForm>, transactionDefinitionKey: string, formKey: string): Observable<IForm> {
    return this._handlePut$<IForm>(`/v1/admin/transactions/${transactionDefinitionKey}/forms/${formKey}`, formWrapper, {}).pipe();
  }

  /**
   * Create a new note for a transaction
   */
  public createNote$(transactionId: string, noteModel: NoteModel): Observable<NoteModel> {
    return this._handlePost$<INote>(`/v1/transactions/${transactionId}/notes`, noteModel.toSchema()).pipe(map((note: INote) => new NoteModel(note)));
  }

  /**
   * Get notes for a transaction
   */
  public getNotes$(transactionId: string, pagingRequestModel?: PagingRequestModel): Observable<INotesPaginationResponse<NoteModel>> {
    return this._handleGet$<INotesPaginationResponse<NoteModel>>(
      `/v1/transactions/${transactionId}/notes/${pagingRequestModel ? pagingRequestModel.toSchema() : ''}`,
    ).pipe(
      map(notesSchema => ({
        items: notesSchema.items.map(noteSchema => new NoteModel(noteSchema)),
        pagingMetadata: new PagingResponseModel(notesSchema.pagingMetadata),
      })),
    );
  }

  /**
   * Get a note from a transaction
   */
  public getNote$(transactionId: string, noteId: string): Observable<NoteModel> {
    return this._handleGet$<NoteModel>(`/v1/transactions/${transactionId}/notes/${noteId}`);
  }

  /**
   * Delete a note for a transaction
   */
  public deleteNote$(transactionId: string, noteId: string): Observable<void> {
    return this._handleDelete$(`/v1/transactions/${transactionId}/notes/${noteId}`, { observe: 'response' });
  }

  /**
   * Update a note for a transaction
   */
  public updateNote$(transactionId: string, noteId: string, noteModel: NoteModel): Observable<NoteModel> {
    return this._handlePut$<INote>(`/v1/transactions/${transactionId}/notes/${noteId}`, noteModel.toSchema()).pipe(map((note: INote) => new NoteModel(note)));
  }

  /**
   * Initiate documents processing
   */
  public processDocuments$(transactionId: string, processDocumentsModel: ProcessDocumentsModel): Observable<IProcessDocumentsResponse> {
    return this._handlePost$<IProcessDocumentsResponse>(`/v1/transactions/${transactionId}/process-documents`, processDocumentsModel.toSchema()).pipe(
      map(processDocumentsResponseSchema => processDocumentsResponseSchema),
    );
  }

  /**
   * Get a single dashboard by transaction set key
   */
  public getDashboard$(transactionSetKey: string): Observable<DashboardModel> {
    return this._handleGet$<IDashboard>(`/v1/admin/dashboards/${transactionSetKey}`).pipe(map(dashboardSchema => new DashboardModel(dashboardSchema)));
  }

  /**
   * Get a all dashboards
   */
  public getDashboards$(): Observable<DashboardModel[]> {
    return this._handleGet$<IDashboard[]>(`/v1/admin/dashboards`).pipe(
      map(dashboardsSchema => dashboardsSchema.map(dashboardSchema => new DashboardModel(dashboardSchema))),
    );
  }
}
